# Windows 授权码生成器

这是一个独立的 Windows 桌面工具，用于调用腾讯服务器上的
`lizhipeichang-h5-admin` 命令生成完整版授权码。

## 使用

1. 双击 `release/离职赔偿授权码生成器.exe`。
2. 确认 SSH 私钥路径，默认是 `%USERPROFILE%\.ssh\refa_deploy2`。
3. 填写订单备注或用途。
4. 设置生成数量（1 到 50）。自定义授权码仅在数量为 1 时可用。
5. 可选：勾选有效期。
6. 点击生成按钮，结果会显示在右侧列表中。
7. 可以复制全部授权码，或导出 CSV 保存订单备注、授权码、记录 ID、设备上限和有效期。

设备上限固定为 2 台。授权码只在服务器上保存哈希，工具本地不保存授权码历史。

## 连接要求

- 本机需能通过 SSH 连接 `ubuntu@43.142.106.42:22`。
- 当前 IP 必须已加入腾讯云防火墙的 SSH 来源规则。
- 服务器上必须已部署 `lizhipeichang-h5-admin`。
- SSH 私钥和服务器 sudo 权限只保留在本机和服务器，不写入 exe。

## 构建

Windows 10/11 自带 .NET Framework 4.8，可直接使用系统 C# 编译器：

```powershell
powershell -ExecutionPolicy Bypass -File .\tools\windows-auth-generator\build.ps1
```

输出：

```text
tools/windows-auth-generator/release/离职赔偿授权码生成器.exe
```

该 exe 依赖 Windows 自带的 .NET Framework 4.8，不需要另外安装 .NET SDK。重新构建前应先关闭正在运行的生成器。

exe 未做商业代码签名，首次运行时 Windows SmartScreen 可能显示“未知发布者”。可以核对本目录提供的 SHA-256 或在确认来源后选择继续运行。
