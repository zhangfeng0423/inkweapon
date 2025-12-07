#!/bin/bash

# 杀掉所有占用指定端口的进程
# 支持多个端口：3000, 3001, 3002, 8080, 8000 等

# 默认要杀掉的端口列表
DEFAULT_PORTS=(3000 3001 3002 8080 8000 5173)

# 如果用户提供了参数，使用用户提供的端口
if [ $# -gt 0 ]; then
    PORTS=("$@")
else
    PORTS=("${DEFAULT_PORTS[@]}")
fi

echo "🔍 正在查找占用以下端口的进程: ${PORTS[*]}"

# 统计找到的进程
FOUND_ANY=false

for PORT in "${PORTS[@]}"; do
    # 使用 lsof 查找占用指定端口的进程
    PIDS=$(lsof -ti:$PORT 2>/dev/null)

    if [ -n "$PIDS" ]; then
        echo ""
        echo "📋 找到以下进程占用 $PORT 端口:"
        lsof -i:$PORT

        # 逐个杀掉进程
        for PID in $PIDS; do
            echo "⚡ 正在终止进程 $PID (端口: $PORT)..."
            kill -9 $PID 2>/dev/null

            if [ $? -eq 0 ]; then
                echo "✅ 进程 $PID 已被终止"
            else
                echo "❌ 无法终止进程 $PID (可能需要 sudo 权限)"
            fi
        done

        FOUND_ANY=true
    else
        echo "✅ 端口 $PORT 未被占用"
    fi
done

if [ "$FOUND_ANY" = true ]; then
    echo ""
    echo "🎉 端口清理完成！"
else
    echo ""
    echo "✅ 所有指定端口都未被占用"
fi

echo ""
echo "💡 提示:"
echo "   - 使用方式1: ./scripts/kill-port.sh (清理默认端口 3000,3001,3002,8080,8000,5173)"
echo "   - 使用方式2: ./scripts/kill-port.sh 3000 4000 5000 (清理指定端口)"
echo "   - 使用方式3: pnpm kill-port (清理默认端口)"