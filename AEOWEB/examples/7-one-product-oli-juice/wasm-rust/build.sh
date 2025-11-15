#!/bin/bash

# Build script for compiling Rust to WebAssembly
# This script builds the WASM module and copies it to the public directory

set -e

echo "🦀 Building OLI Juice WASM module from Rust..."

# Check if wasm-pack is installed
if ! command -v wasm-pack &> /dev/null; then
    echo "❌ wasm-pack not found. Installing..."
    curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
fi

# Build the WASM module
echo "📦 Compiling Rust to WebAssembly..."
wasm-pack build --target web --out-dir ../public/wasm --release

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ WASM build successful!"
    echo "📄 Output files:"
    ls -lh ../public/wasm/

    # Show file sizes
    echo ""
    echo "📊 WASM module size:"
    du -h ../public/wasm/oli_juice_wasm_bg.wasm

    echo ""
    echo "🎉 Ready to use! Import in your HTML:"
    echo "   <script type=\"module\">"
    echo "     import init, * as wasm from './wasm/oli_juice_wasm.js';"
    echo "     await init();"
    echo "   </script>"
else
    echo "❌ Build failed!"
    exit 1
fi
