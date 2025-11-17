# Build stage
FROM rust:1.75-slim as builder

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy workspace files
COPY Cargo.toml Cargo.lock ./
COPY shared ./shared
COPY backend/gateway ./backend/gateway

# Build the application
RUN cargo build --release --package asa-gateway

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    && rm -rf /var/lib/apt/lists/*

# Copy the binary from builder
COPY --from=builder /app/target/release/asa-gateway /app/asa-gateway

# Expose port
EXPOSE 8080

# Run the application
CMD ["/app/asa-gateway"]
