use axum::{
    extract::{Request, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{any, delete, post},
    Json, Router,
};
use serde::Deserialize;
use std::{
    collections::HashMap,
    net::SocketAddr,
    sync::{Arc, RwLock},
};
use tokio::time::{sleep, Duration};
use tower_http::cors::CorsLayer;

type MockMap = Arc<RwLock<HashMap<MockKey, MockEntry>>>;

/// Lookup key: provider-specific mocks take priority over wildcard ones.
/// A `None` provider matches any (or no) provider header.
#[derive(Clone, PartialEq, Eq, Hash)]
struct MockKey {
    path: String,
    provider: Option<String>,
}

#[derive(Clone)]
struct MockEntry {
    body: String,
    status: u16,
    content_type: String,
    delay_ms: u64,
}

#[derive(Deserialize)]
struct RegisterRequest {
    path: String,
    body: String,
    /// Optional provider name ("openai" | "anthropic" | "google").
    /// When set, this mock only matches requests with a matching X-Api-Provider header.
    provider: Option<String>,
    #[serde(default = "default_status")]
    status: u16,
    #[serde(default = "default_content_type")]
    content_type: String,
    /// Optional artificial delay in milliseconds before the response is sent.
    #[serde(default)]
    delay_ms: u64,
}

fn default_status() -> u16 {
    200
}
fn default_content_type() -> String {
    "application/json".into()
}

async fn register(State(map): State<MockMap>, Json(req): Json<RegisterRequest>) -> StatusCode {
    map.write().unwrap().insert(
        MockKey { path: req.path, provider: req.provider },
        MockEntry { body: req.body, status: req.status, content_type: req.content_type, delay_ms: req.delay_ms },
    );
    StatusCode::OK
}

async fn reset(State(map): State<MockMap>) -> StatusCode {
    map.write().unwrap().clear();
    StatusCode::OK
}

async fn handle(State(map): State<MockMap>, request: Request) -> impl IntoResponse {
    let path = request.uri().path().to_string();
    let provider = request
        .headers()
        .get("x-api-provider")
        .and_then(|v| v.to_str().ok())
        .map(str::to_owned);

    // Clone the entry while holding the lock, then release before any await.
    let entry = {
        let map = map.read().unwrap();
        provider
            .as_ref()
            .and_then(|p| map.get(&MockKey { path: path.clone(), provider: Some(p.clone()) }))
            .or_else(|| map.get(&MockKey { path: path.clone(), provider: None }))
            .cloned()
    };

    match entry {
        Some(entry) => {
            if entry.delay_ms > 0 {
                sleep(Duration::from_millis(entry.delay_ms)).await;
            }
            (
                StatusCode::from_u16(entry.status).unwrap_or(StatusCode::OK),
                [(axum::http::header::CONTENT_TYPE, entry.content_type.clone())],
                entry.body.clone(),
            )
                .into_response()
        }
        None => (
            StatusCode::NOT_FOUND,
            format!("No mock registered for {path}"),
        )
            .into_response(),
    }
}


#[tokio::main]
async fn main() {
    let map: MockMap = Arc::new(RwLock::new(HashMap::new()));
    let app = Router::new()
        .route("/__mock/register", post(register))
        .route("/__mock/reset", delete(reset))
        .fallback(any(handle))
        .layer(CorsLayer::permissive())
        .with_state(map);

    let addr = SocketAddr::from(([127, 0, 0, 1], 11513));
    println!("[mock-server] Listening on {addr}");
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
