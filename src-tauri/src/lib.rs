use axum::{
    extract::State,
    http::{Request, StatusCode},
    response::Response,
    routing::any,
    Router,
};
use reqwest::Client;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Clone)]
struct ProxyState {
    client: Client,
    openai_api_key: Option<String>,
}

async fn proxy_handler(
    State(state): State<Arc<ProxyState>>,
    req: Request<axum::body::Body>,
) -> Result<Response, StatusCode> {
    let path = req.uri().path();
    let path_query = req
        .uri()
        .path_and_query()
        .map(|v| v.as_str())
        .unwrap_or(path);

    let target_url_base = match req.headers().get("X-Proxy-Target-Url") {
        Some(url) => url.to_str().map_err(|_| StatusCode::BAD_REQUEST)?.to_string(),
        None => {
            return Err(StatusCode::BAD_REQUEST);
        }
    };

    let target_url = format!("{}{}", target_url_base, path_query);

    let method = req.method().clone();
    let headers = req.headers().clone();
    
    let body_bytes = axum::body::to_bytes(req.into_body(), usize::MAX)
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Check method and body_bytes before they're moved
    let is_post = method == axum::http::Method::POST;
    let body_is_empty = body_bytes.is_empty();
    let has_content_type = headers.contains_key("content-type");

    let body = reqwest::Body::from(body_bytes);

    let mut request_builder = state.client.request(method, &target_url);

    // Forward headers from the incoming request, excluding proxy-specific and connection headers
    // Also exclude content-length since reqwest will set it automatically
    // Exclude authorization since we'll set our own API key
    // Exclude accept-encoding to avoid compression issues
    let excluded_headers = [
        "x-proxy-target-url",
        "host",
        "connection",
        "keep-alive",
        "proxy-authorization",
        "te",
        "trailer",
        "transfer-encoding",
        "upgrade",
        "content-length", // reqwest sets this automatically
        "authorization",   // we set our own API key
        "accept-encoding", // don't request compression to avoid decompression issues
    ];

    for (name, value) in headers.iter() {
        let header_name_lower = name.as_str().to_lowercase();
        if !excluded_headers.contains(&header_name_lower.as_str()) {
            request_builder = request_builder.header(name, value);
        }
    }

    // Add OpenAI API key to Authorization header if available
    // This will override any existing Authorization header from the client
    if let Some(ref api_key) = state.openai_api_key {
        let auth_header = format!("Bearer {}", api_key);
        request_builder = request_builder.header("Authorization", &auth_header);
    }
    
    // Ensure User-Agent is set (Cloudflare/OpenAI may require it)
    if !headers.contains_key("user-agent") {
        request_builder = request_builder.header("User-Agent", "reticle-proxy/1.0");
    }
    
    // Ensure Content-Type is set for POST requests with body
    if is_post && !body_is_empty && !has_content_type {
        request_builder = request_builder.header("Content-Type", "application/json");
    }
    
    // Measure latency: start timing right before the HTTP request
    let start_time = std::time::Instant::now();
    
    let response = request_builder
        .body(body)
        .send()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    // Calculate latency in milliseconds
    let latency_ms = start_time.elapsed().as_millis() as u64;

    let response_status = response.status();
    let response_headers = response.headers().clone();

    let mut response_builder = Response::builder().status(response_status);
    
    // Add latency header so the client can read it
    response_builder = response_builder.header("X-Request-Latency-Ms", latency_ms.to_string());
    
    // It's important to clone headers from the response
    for (name, value) in response_headers.iter() {
        // Filter out headers that might cause issues when proxying,
        // as axum will manage the body and its encoding/length.
        let header_name_lower = name.as_str().to_lowercase();
        if header_name_lower != "content-encoding" &&
           header_name_lower != "content-length" &&
           header_name_lower != "transfer-encoding" {
            response_builder = response_builder.header(name, value);
        }
    }
    
    // Use text() to get decompressed response body (reqwest handles decompression automatically)
    // By not forwarding accept-encoding, the server should send uncompressed content
    let response_body_text = response.text().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    // Convert text back to bytes for the response body
    let response_body_bytes = response_body_text.into_bytes();
    Ok(response_builder.body(axum::body::Body::from(response_body_bytes)).unwrap())
}

async fn hello_world() -> &'static str {
    "Hello from proxy server!"
}

async fn start_proxy_server() {
    // Create a reqwest client with proper configuration
    let client = Client::builder()
        .user_agent("reticle-proxy/1.0")
        .build()
        .expect("Failed to create HTTP client");
    
    // Read OpenAI API key from environment variable
    let openai_api_key = "sk-proj";

    let state = Arc::new(ProxyState {
        client,
        openai_api_key: Some(openai_api_key.to_string()),
    });

    let cors = CorsLayer::new()
        .allow_methods(Any)
        .allow_origin(Any)
        .allow_headers(Any)
        .expose_headers(Any); // Expose all headers including our custom latency header

    let app = Router::new()
        .route("/", axum::routing::get(hello_world)) // New route for the root path
        .route("/*path", any(proxy_handler))
        .with_state(state)
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 11513));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::async_runtime::spawn(start_proxy_server());
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
