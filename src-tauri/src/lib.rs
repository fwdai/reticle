use axum::{
    extract::State,
    http::{Request, StatusCode},
    response::Response,
    routing::any,
    Router,
};
use reqwest::Client;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

async fn proxy_handler(
    State(client): State<Client>,
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
    eprintln!("Proxying request to: {}", target_url);

    let method = req.method().clone();
    let headers = req.headers().clone();
    let body_bytes = axum::body::to_bytes(req.into_body(), usize::MAX)
        .await
        .map_err(|e| {
            eprintln!("Error reading request body: {:?}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let mut request_builder = client.request(method, &target_url);

    for (name, value) in headers.iter() {
        if name.as_str().to_lowercase() != "x-proxy-target-url" {
            request_builder = request_builder.header(name, value);
        }
    }
    
    let response = request_builder
        .body(body_bytes)
        .send()
        .await
        .map_err(|e| {
            eprintln!("Error sending request to target URL {}: {:?}", target_url, e);
            StatusCode::INTERNAL_SERVER_ERROR
        })?;

    let mut response_builder = Response::builder().status(response.status());
    
    // It's important to clone headers from the response
    let response_headers = response.headers().clone();
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
    
    let response_body = response.bytes().await.map_err(|e| {
        eprintln!("Error reading response body from target URL {}: {:?}", target_url, e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(response_builder.body(axum::body::Body::from(response_body)).unwrap())
}

async fn hello_world() -> &'static str {
    "Hello from proxy server!"
}

async fn start_proxy_server() {
    let client = Client::new();
    let cors = CorsLayer::new()
        .allow_methods(Any)
        .allow_origin(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/", axum::routing::get(hello_world)) // New route for the root path
        .route("/*path", any(proxy_handler))
        .with_state(client)
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 11513));
    println!("Proxy server attempting to listen on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    println!("Proxy server listening on {}", listener.local_addr().unwrap());
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
