use axum::{
    extract::State,
    http::{Request, StatusCode},
    response::Response,
    routing::any,
    Router,
};
use reqwest::Client;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex}; // Added Mutex
use tower_http::cors::{Any, CorsLayer};
use tauri::{AppHandle, Manager};
use rusqlite::Connection;
use serde_json::json;

#[derive(Clone)]
struct ProxyState {
    client: Client,
    app_handle: AppHandle,
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

    let is_post = method == axum::http::Method::POST;
    let body_is_empty = body_bytes.is_empty();
    let has_content_type = headers.contains_key("content-type");

    let body = reqwest::Body::from(body_bytes);

    let mut request_builder = state.client.request(method, &target_url);

    let excluded_headers = [
        "x-proxy-target-url",
        "x-api-provider",
        "host",
        "connection",
        "keep-alive",
        "proxy-authorization",
        "te",
        "trailer",
        "transfer-encoding",
        "upgrade",
        "content-length",
        "authorization",
        "accept-encoding",
    ];

    for (name, value) in headers.iter() {
        let header_name_lower = name.as_str().to_lowercase();
        if !excluded_headers.contains(&header_name_lower.as_str()) {
            request_builder = request_builder.header(name, value);
        }
    }

    // --- Fetch API key from DB based on X-Api-Provider header ---
    let api_provider_option: Option<String> = match headers.get("X-Api-Provider") {
        Some(provider) => Some(provider.to_str().map_err(|_| StatusCode::BAD_REQUEST)?.to_string()),
        None => None,
    };

    if let Some(provider) = api_provider_option {
        let db_state: tauri::State<Arc<Mutex<Connection>>> = state.app_handle.state();
        let db_conn = db_state.lock().unwrap();

        let api_key_result = crate::database::db_select(&db_conn, "api_keys", json!({
            "where": {
                "provider": provider
            }
        }));

        if let Ok(mut keys) = api_key_result {
            if let Some(key_entry) = keys.pop() {
                if let Some(api_key_val) = key_entry.get("key") {
                    if let Some(api_key) = api_key_val.as_str() {
                        let auth_header = format!("Bearer {}", api_key);
                        request_builder = request_builder.header("Authorization", &auth_header);
                    }
                }
            }
        }
    }
    // --- End Fetch API key ---
    
    if !headers.contains_key("user-agent") {
        request_builder = request_builder.header("User-Agent", "reticle-proxy/1.0");
    }
    
    if is_post && !body_is_empty && !has_content_type {
        request_builder = request_builder.header("Content-Type", "application/json");
    }
    
    let start_time = std::time::Instant::now();
    
    let response = request_builder
        .body(body)
        .send()
        .await
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    
    let latency_ms = start_time.elapsed().as_millis() as u64;

    let response_status = response.status();
    let response_headers = response.headers().clone();

    let mut response_builder = Response::builder().status(response_status);
    
    response_builder = response_builder.header("X-Request-Latency-Ms", latency_ms.to_string());
    
    for (name, value) in response_headers.iter() {
        let header_name_lower = name.as_str().to_lowercase();
        if header_name_lower != "content-encoding" &&
           header_name_lower != "content-length" &&
           header_name_lower != "transfer-encoding" {
            response_builder = response_builder.header(name, value);
        }
    }
    
    let response_body_text = response.text().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    let response_body_bytes = response_body_text.into_bytes();
    Ok(response_builder.body(axum::body::Body::from(response_body_bytes)).unwrap())
}

async fn hello_world() -> &'static str {
    "Hello from proxy server!"
}

pub async fn start_proxy_server(app_handle: AppHandle) {
    let client = Client::builder()
        .user_agent("reticle-proxy/1.0")
        .build()
        .expect("Failed to create HTTP client");
    
    let state = Arc::new(ProxyState {
        client,
        app_handle,
    });

    let cors = CorsLayer::new()
        .allow_methods(Any)
        .allow_origin(Any)
        .allow_headers(Any)
        .expose_headers(Any);

    let app = Router::new()
        .route("/", axum::routing::get(hello_world))
        .route("/*path", any(proxy_handler))
        .with_state(state)
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 11513));
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}