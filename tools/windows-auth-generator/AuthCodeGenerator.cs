using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Globalization;
using System.IO;
using System.Runtime.InteropServices;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Json;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace LiZhiPeiChang.AuthGenerator
{
    internal static class Program
    {
        [STAThread]
        private static void Main(string[] args)
        {
            if (args.Length >= 2 && args[0] == "--render-preview")
            {
                RenderPreview(args[1]);
                return;
            }

            if (args.Length >= 1 && args[0] == "--self-test")
            {
                Environment.ExitCode = RunSelfTest();
                return;
            }

            if (args.Length >= 1 && args[0] == "--ssh-self-test")
            {
                Environment.ExitCode = MainForm.RunSshSelfTest();
                return;
            }

            if (args.Length >= 1 && args[0] == "--csv-self-test")
            {
                Environment.ExitCode = MainForm.RunCsvSelfTest();
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }

        private static void RenderPreview(string outputPath)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            using (MainForm form = new MainForm())
            {
                form.StartPosition = FormStartPosition.Manual;
                form.Location = new Point(-2400, -2400);
                form.ShowInTaskbar = false;
                form.Show();
                Application.DoEvents();

                using (Bitmap bitmap = new Bitmap(form.Width, form.Height))
                {
                    form.DrawToBitmap(bitmap, new Rectangle(0, 0, form.Width, form.Height));
                    string directory = Path.GetDirectoryName(Path.GetFullPath(outputPath));
                    if (!String.IsNullOrEmpty(directory))
                    {
                        Directory.CreateDirectory(directory);
                    }
                    bitmap.Save(outputPath, System.Drawing.Imaging.ImageFormat.Png);
                }
                form.Close();
            }
        }

        private static int RunSelfTest()
        {
            try
            {
                string command = MainForm.BuildRemoteCreateCommand(
                    "测试订单'O1",
                    "LZ-ABCD-2345",
                    "2027-12-31T23:59:59+08:00");
                if (command.IndexOf("测试订单", StringComparison.Ordinal) < 0 ||
                    command.IndexOf("LZ-ABCD-2345", StringComparison.Ordinal) < 0 ||
                    command.IndexOf("2027-12-31T23:59:59+08:00", StringComparison.Ordinal) < 0)
                {
                    return 1;
                }
                string batchCommand = MainForm.BuildRemoteBatchCommand(
                    "测试批次",
                    5,
                    null);
                if (batchCommand.IndexOf("create-batch", StringComparison.Ordinal) < 0 ||
                    batchCommand.IndexOf("--count 5", StringComparison.Ordinal) < 0 ||
                    batchCommand.IndexOf("测试批次", StringComparison.Ordinal) < 0)
                {
                    return 1;
                }
                return 0;
            }
            catch
            {
                return 1;
            }
        }

    }

    internal sealed class MainForm : Form
    {
        private const string DefaultHost = "43.142.106.42";
        private const string DefaultUser = "ubuntu";
        private const string LoginUrl = "https://h5.shuzi8.com";
        private const int EmSetCueBanner = 0x1501;

        private static readonly Color Ink = Color.FromArgb(23, 32, 51);
        private static readonly Color Muted = Color.FromArgb(100, 116, 139);
        private static readonly Color Brand = Color.FromArgb(15, 118, 110);
        private static readonly Color BrandDark = Color.FromArgb(17, 94, 89);
        private static readonly Color Canvas = Color.FromArgb(247, 250, 252);
        private static readonly Color Border = Color.FromArgb(219, 227, 232);
        private static readonly Color Warm = Color.FromArgb(180, 83, 9);

        private readonly Font bodyFont = new Font("Microsoft YaHei UI", 9.5F, FontStyle.Regular);
        private readonly Font labelFont = new Font("Microsoft YaHei UI", 9F, FontStyle.Bold);
        private readonly Font titleFont = new Font("Microsoft YaHei UI", 24F, FontStyle.Bold);
        private readonly Font codeFont = new Font("Consolas", 19F, FontStyle.Bold);
        private readonly Font smallFont = new Font("Microsoft YaHei UI", 8.5F, FontStyle.Regular);

        private TextBox labelBox;
        private TextBox customCodeBox;
        private CheckBox expiryCheckBox;
        private DateTimePicker expiryPicker;
        private TextBox hostBox;
        private TextBox userBox;
        private TextBox keyPathBox;
        private NumericUpDown quantityBox;
        private TextBox generatedCodeBox;
        private Label statusLabel;
        private Label resultMetaLabel;
        private RoundedButton generateButton;
        private RoundedButton copyButton;
        private RoundedButton exportButton;
        private RoundedButton testButton;
        private LinkLabel openLoginLink;
        private readonly List<GeneratedCodeRow> generatedRows = new List<GeneratedCodeRow>();

        public MainForm()
        {
            Text = "离职赔偿授权码生成器";
            StartPosition = FormStartPosition.CenterScreen;
            ClientSize = new Size(760, 880);
            MinimumSize = new Size(760, 720);
            MaximizeBox = false;
            FormBorderStyle = FormBorderStyle.Sizable;
            AutoScroll = true;
            BackColor = Canvas;
            Font = bodyFont;
            AutoScaleMode = AutoScaleMode.Dpi;
            BuildInterface();
        }

        protected override void OnShown(EventArgs e)
        {
            base.OnShown(e);
            SetPlaceholder(labelBox, "例如：小红书订单-001");
            SetPlaceholder(customCodeBox, "留空自动生成");
            SetPlaceholder(generatedCodeBox, "生成后显示授权码");
        }

        internal static int RunSshSelfTest()
        {
            using (MainForm form = new MainForm())
            {
                form.labelBox.Text = "windows-self-test";
                form.quantityBox.Value = 2;
                string remoteCommand;
                string validationError;
                if (!form.TryBuildGenerateCommand(out remoteCommand, out validationError))
                {
                    return 1;
                }

                try
                {
                    ProcessResult result = form.RunSsh(remoteCommand);
                    if (result.ExitCode != 0)
                    {
                        return 2;
                    }
                    return ParseGeneratedRows(result.StandardOutput).Count == 2 ? 0 : 3;
                }
                catch
                {
                    return 4;
                }
            }
        }

        internal static int RunCsvSelfTest()
        {
            List<GeneratedCodeRow> rows = new List<GeneratedCodeRow>();
            rows.Add(new GeneratedCodeRow
            {
                Id = "code_test",
                Code = "LZ-TEST-0001",
                Label = "订单,001",
                MaxDevices = 2,
                ExpiresAt = String.Empty
            });
            string csv = BuildExportContent(true, rows);
            return csv.IndexOf("订单备注", StringComparison.Ordinal) >= 0 &&
                   csv.IndexOf("\"订单,001\"", StringComparison.Ordinal) >= 0 &&
                   csv.IndexOf("LZ-TEST-0001", StringComparison.Ordinal) >= 0
                ? 0
                : 1;
        }

        private void BuildInterface()
        {
            Panel header = new Panel();
            header.Dock = DockStyle.Top;
            header.Height = 108;
            header.BackColor = Color.White;
            header.Paint += delegate(object sender, PaintEventArgs e)
            {
                using (Pen pen = new Pen(Border))
                {
                    e.Graphics.DrawLine(pen, 0, header.Height - 1, header.Width, header.Height - 1);
                }
            };
            Controls.Add(header);

            Panel mark = new Panel();
            mark.Location = new Point(28, 28);
            mark.Size = new Size(44, 44);
            mark.BackColor = Brand;
            header.Controls.Add(mark);

            Label markText = new Label();
            markText.Text = "法";
            markText.Dock = DockStyle.Fill;
            markText.TextAlign = ContentAlignment.MiddleCenter;
            markText.ForeColor = Color.White;
            markText.Font = new Font("Microsoft YaHei UI", 16F, FontStyle.Bold);
            mark.Controls.Add(markText);

            Label productLabel = new Label();
            productLabel.Text = "离职赔偿计算系统";
            productLabel.AutoSize = true;
            productLabel.Location = new Point(84, 24);
            productLabel.ForeColor = Brand;
            productLabel.Font = labelFont;
            header.Controls.Add(productLabel);

            Label titleLabel = new Label();
            titleLabel.Text = "Windows 授权码生成器";
            titleLabel.AutoSize = true;
            titleLabel.Location = new Point(82, 43);
            titleLabel.ForeColor = Ink;
            titleLabel.Font = titleFont;
            header.Controls.Add(titleLabel);

            SurfacePanel settings = CreateCard(24, 128, 712, 244);
            Controls.Add(settings);
            AddSectionTitle(settings, "生成设置", 24, 18);
            AddCaption(settings, "授权码只会显示一次，生成后请立即复制。", 142, 20, Warm);

            AddFieldLabel(settings, "订单备注或用途", 24, 52);
            labelBox = CreateTextBox(settings, 24, 74, 664);
            labelBox.AccessibleName = "订单备注或用途";
            labelBox.TabIndex = 0;

            AddFieldLabel(settings, "自定义授权码（可选）", 24, 118);
            customCodeBox = CreateTextBox(settings, 24, 140, 664);
            customCodeBox.AccessibleName = "自定义授权码";
            customCodeBox.CharacterCasing = CharacterCasing.Upper;
            customCodeBox.TabIndex = 1;

            expiryCheckBox = new CheckBox();
            expiryCheckBox.Text = "设置有效期";
            expiryCheckBox.AutoSize = true;
            expiryCheckBox.Location = new Point(24, 191);
            expiryCheckBox.ForeColor = Ink;
            expiryCheckBox.Font = bodyFont;
            expiryCheckBox.CheckedChanged += delegate
            {
                expiryPicker.Enabled = expiryCheckBox.Checked;
            };
            settings.Controls.Add(expiryCheckBox);

            expiryPicker = new DateTimePicker();
            expiryPicker.Format = DateTimePickerFormat.Custom;
            expiryPicker.CustomFormat = "yyyy-MM-dd HH:mm";
            expiryPicker.ShowUpDown = true;
            expiryPicker.Location = new Point(132, 188);
            expiryPicker.Size = new Size(190, 30);
            expiryPicker.Font = bodyFont;
            expiryPicker.Enabled = false;
            expiryPicker.Value = DateTime.Today.AddYears(1).AddHours(23).AddMinutes(59);
            settings.Controls.Add(expiryPicker);

            AddInlineLabel(settings, "生成数量", 350, 195);
            quantityBox = new NumericUpDown();
            quantityBox.Minimum = 1;
            quantityBox.Maximum = 50;
            quantityBox.Value = 1;
            quantityBox.Location = new Point(421, 191);
            quantityBox.Size = new Size(58, 30);
            quantityBox.Font = bodyFont;
            quantityBox.TextAlign = HorizontalAlignment.Center;
            quantityBox.AccessibleName = "生成数量";
            quantityBox.ValueChanged += delegate
            {
                bool single = quantityBox.Value == 1;
                customCodeBox.Enabled = single;
                if (!single)
                {
                    customCodeBox.Text = String.Empty;
                }
                UpdateGenerateButtonText();
            };
            settings.Controls.Add(quantityBox);

            AddCaption(settings, "每码 2 台（固定）", 492, 195, BrandDark);

            SurfacePanel connection = CreateCard(24, 390, 712, 154);
            Controls.Add(connection);
            AddSectionTitle(connection, "连接设置", 24, 16);

            AddFieldLabel(connection, "SSH 私钥", 24, 47);
            keyPathBox = CreateTextBox(connection, 24, 69, 520);
            keyPathBox.Text = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),
                ".ssh",
                "refa_deploy2");
            keyPathBox.AccessibleName = "SSH 私钥路径";
            keyPathBox.TabIndex = 2;

            RoundedButton browseButton = new RoundedButton();
            browseButton.Text = "选择密钥";
            browseButton.Location = new Point(556, 67);
            browseButton.Size = new Size(132, 34);
            browseButton.Kind = ButtonKind.Secondary;
            browseButton.Font = labelFont;
            browseButton.Click += BrowseKeyButton_Click;
            connection.Controls.Add(browseButton);

            AddInlineLabel(connection, "服务器", 24, 116);
            hostBox = CreateCompactTextBox(connection, 78, 113, 194);
            hostBox.Text = DefaultHost;
            hostBox.AccessibleName = "服务器地址";

            AddInlineLabel(connection, "用户", 300, 116);
            userBox = CreateCompactTextBox(connection, 346, 113, 112);
            userBox.Text = DefaultUser;
            userBox.AccessibleName = "SSH 用户";

            testButton = new RoundedButton();
            testButton.Text = "测试连接";
            testButton.Location = new Point(548, 111);
            testButton.Size = new Size(140, 36);
            testButton.Kind = ButtonKind.Secondary;
            testButton.Font = labelFont;
            testButton.Click += TestButton_Click;
            connection.Controls.Add(testButton);

            generateButton = new RoundedButton();
            generateButton.Text = "生成授权码";
            generateButton.Location = new Point(24, 562);
            generateButton.Size = new Size(712, 56);
            generateButton.Kind = ButtonKind.Primary;
            generateButton.Font = new Font("Microsoft YaHei UI", 12F, FontStyle.Bold);
            generateButton.Click += GenerateButton_Click;
            Controls.Add(generateButton);
            UpdateGenerateButtonText();

            SurfacePanel resultCard = CreateCard(24, 636, 712, 210);
            Controls.Add(resultCard);

            Label resultTitle = new Label();
            resultTitle.Text = "生成结果";
            resultTitle.AutoSize = true;
            resultTitle.Location = new Point(24, 16);
            resultTitle.ForeColor = Ink;
            resultTitle.Font = new Font("Microsoft YaHei UI", 11F, FontStyle.Bold);
            resultCard.Controls.Add(resultTitle);

            generatedCodeBox = new TextBox();
            generatedCodeBox.ReadOnly = true;
            generatedCodeBox.Location = new Point(24, 44);
            generatedCodeBox.Size = new Size(500, 98);
            generatedCodeBox.BorderStyle = BorderStyle.FixedSingle;
            generatedCodeBox.BackColor = Color.FromArgb(248, 250, 252);
            generatedCodeBox.ForeColor = Muted;
            generatedCodeBox.Font = new Font("Consolas", 11F, FontStyle.Regular);
            generatedCodeBox.Multiline = true;
            generatedCodeBox.ScrollBars = ScrollBars.Vertical;
            generatedCodeBox.WordWrap = false;
            generatedCodeBox.TextAlign = HorizontalAlignment.Left;
            generatedCodeBox.AccessibleName = "生成的授权码";
            resultCard.Controls.Add(generatedCodeBox);

            copyButton = new RoundedButton();
            copyButton.Text = "复制授权码";
            copyButton.Location = new Point(540, 44);
            copyButton.Size = new Size(148, 44);
            copyButton.Kind = ButtonKind.Secondary;
            copyButton.Font = labelFont;
            copyButton.Enabled = false;
            copyButton.Click += CopyButton_Click;
            resultCard.Controls.Add(copyButton);

            exportButton = new RoundedButton();
            exportButton.Text = "导出 CSV";
            exportButton.Location = new Point(540, 96);
            exportButton.Size = new Size(148, 44);
            exportButton.Kind = ButtonKind.Secondary;
            exportButton.Font = labelFont;
            exportButton.Enabled = false;
            exportButton.Click += ExportButton_Click;
            resultCard.Controls.Add(exportButton);

            statusLabel = new Label();
            statusLabel.Text = "等待生成";
            statusLabel.AutoSize = false;
            statusLabel.Location = new Point(24, 148);
            statusLabel.Size = new Size(500, 24);
            statusLabel.ForeColor = Muted;
            statusLabel.Font = smallFont;
            statusLabel.AutoEllipsis = true;
            resultCard.Controls.Add(statusLabel);

            resultMetaLabel = new Label();
            resultMetaLabel.Text = "";
            resultMetaLabel.AutoSize = false;
            resultMetaLabel.Location = new Point(24, 175);
            resultMetaLabel.Size = new Size(500, 20);
            resultMetaLabel.ForeColor = Muted;
            resultMetaLabel.Font = smallFont;
            resultMetaLabel.AutoEllipsis = true;
            resultCard.Controls.Add(resultMetaLabel);

            openLoginLink = new LinkLabel();
            openLoginLink.Text = "打开登录页";
            openLoginLink.AutoSize = true;
            openLoginLink.Location = new Point(592, 174);
            openLoginLink.LinkColor = Brand;
            openLoginLink.ActiveLinkColor = BrandDark;
            openLoginLink.Font = labelFont;
            openLoginLink.LinkClicked += delegate
            {
                Process.Start(new ProcessStartInfo(LoginUrl) { UseShellExecute = true });
            };
            resultCard.Controls.Add(openLoginLink);

            Label footer = new Label();
            footer.Text = "授权码上限固定为 2 台设备。更换浏览器或清除本站 Cookie 后会被视为新设备。";
            footer.AutoSize = false;
            footer.Location = new Point(24, 858);
            footer.Size = new Size(712, 20);
            footer.ForeColor = Muted;
            footer.Font = smallFont;
            footer.TextAlign = ContentAlignment.MiddleCenter;
            Controls.Add(footer);
        }

        private void UpdateGenerateButtonText()
        {
            if (generateButton == null || quantityBox == null)
            {
                return;
            }
            int count = Decimal.ToInt32(quantityBox.Value);
            generateButton.Text =
                count == 1 ? "生成授权码" : String.Format("批量生成 {0} 个授权码", count);
        }

        private SurfacePanel CreateCard(int x, int y, int width, int height)
        {
            SurfacePanel panel = new SurfacePanel();
            panel.Location = new Point(x, y);
            panel.Size = new Size(width, height);
            panel.BackColor = Color.White;
            panel.BorderColor = Border;
            panel.Radius = 10;
            return panel;
        }

        private void AddSectionTitle(Control parent, string text, int x, int y)
        {
            Label label = new Label();
            label.Text = text;
            label.AutoSize = true;
            label.Location = new Point(x, y);
            label.ForeColor = Ink;
            label.Font = new Font("Microsoft YaHei UI", 11F, FontStyle.Bold);
            parent.Controls.Add(label);
        }

        private void AddCaption(Control parent, string text, int x, int y, Color color)
        {
            Label label = new Label();
            label.Text = text;
            label.AutoSize = true;
            label.Location = new Point(x, y);
            label.ForeColor = color;
            label.Font = smallFont;
            parent.Controls.Add(label);
        }

        private void AddFieldLabel(Control parent, string text, int x, int y)
        {
            Label label = new Label();
            label.Text = text;
            label.AutoSize = true;
            label.Location = new Point(x, y);
            label.ForeColor = Ink;
            label.Font = labelFont;
            parent.Controls.Add(label);
        }

        private void AddInlineLabel(Control parent, string text, int x, int y)
        {
            Label label = new Label();
            label.Text = text;
            label.AutoSize = true;
            label.Location = new Point(x, y);
            label.ForeColor = Muted;
            label.Font = labelFont;
            parent.Controls.Add(label);
        }

        private TextBox CreateTextBox(Control parent, int x, int y, int width)
        {
            TextBox box = new TextBox();
            box.Location = new Point(x, y);
            box.Size = new Size(width, 32);
            box.BorderStyle = BorderStyle.FixedSingle;
            box.BackColor = Color.White;
            box.ForeColor = Ink;
            box.Font = bodyFont;
            parent.Controls.Add(box);
            return box;
        }

        private TextBox CreateCompactTextBox(Control parent, int x, int y, int width)
        {
            TextBox box = CreateTextBox(parent, x, y, width);
            box.Size = new Size(width, 30);
            box.Font = new Font("Microsoft YaHei UI", 9F, FontStyle.Regular);
            return box;
        }

        private void BrowseKeyButton_Click(object sender, EventArgs e)
        {
            using (OpenFileDialog dialog = new OpenFileDialog())
            {
                dialog.Title = "选择 SSH 私钥";
                dialog.Filter = "SSH private key|*.*";
                dialog.CheckFileExists = true;
                string current = keyPathBox.Text.Trim();
                if (File.Exists(current))
                {
                    dialog.InitialDirectory = Path.GetDirectoryName(current);
                    dialog.FileName = Path.GetFileName(current);
                }
                if (dialog.ShowDialog(this) == DialogResult.OK)
                {
                    keyPathBox.Text = dialog.FileName;
                }
            }
        }

        private async void GenerateButton_Click(object sender, EventArgs e)
        {
            string validationError;
            string remoteCommand;
            if (!TryBuildGenerateCommand(out remoteCommand, out validationError))
            {
                SetStatus(validationError, true);
                return;
            }

            int requestedCount = Decimal.ToInt32(quantityBox.Value);
            SetBusy(
                true,
                requestedCount > 1
                    ? String.Format("正在批量生成 {0} 个授权码...", requestedCount)
                    : "正在连接服务器并生成授权码...");
            try
            {
                ProcessResult result = await Task.Run(
                    delegate
                    {
                        return RunSsh(remoteCommand);
                    });

                if (result.ExitCode != 0)
                {
                    SetStatus(GetFriendlySshError(result), true);
                    return;
                }

                List<GeneratedCodeRow> rows;
                try
                {
                    rows = ParseGeneratedRows(result.StandardOutput);
                }
                catch (Exception ex)
                {
                    SetStatus("无法解析服务器结果：" + ex.Message, true);
                    return;
                }

                if (rows.Count == 0)
                {
                    SetStatus("服务器未返回授权码，请检查服务器日志。", true);
                    return;
                }

                generatedRows.Clear();
                generatedRows.AddRange(rows);
                RenderGeneratedRows();
                copyButton.Enabled = true;
                exportButton.Enabled = true;
                SetStatus(
                    rows.Count == 1
                        ? "生成成功，请立即复制或导出保存。"
                        : String.Format(
                            "已生成 {0} 个授权码，请立即导出保存。",
                            rows.Count),
                    false);
            }
            catch (Exception ex)
            {
                SetStatus("生成失败：" + ex.Message, true);
            }
            finally
            {
                SetBusy(false, null);
            }
        }

        private async void TestButton_Click(object sender, EventArgs e)
        {
            string error;
            if (!ValidateConnectionSettings(out error))
            {
                SetStatus(error, true);
                return;
            }

            testButton.Enabled = false;
            SetStatus("正在检查 SSH 连接...", false);
            try
            {
                ProcessResult result = await Task.Run(
                    delegate
                    {
                        return RunSsh("sudo lizhipeichang-h5-admin list");
                    });

                if (result.ExitCode != 0)
                {
                    SetStatus(GetFriendlySshError(result), true);
                    return;
                }

                string output = String.IsNullOrWhiteSpace(result.StandardOutput)
                    ? "连接正常，服务器暂未生成授权码。"
                    : "连接正常。已有授权码记录：" + result.StandardOutput.Trim().Replace("\n", "；");
                SetStatus(Truncate(output, 110), false);
            }
            catch (Exception ex)
            {
                SetStatus("连接失败：" + ex.Message, true);
            }
            finally
            {
                testButton.Enabled = true;
            }
        }

        private void CopyButton_Click(object sender, EventArgs e)
        {
            if (generatedRows.Count == 0)
            {
                return;
            }
            try
            {
                StringBuilder codes = new StringBuilder();
                foreach (GeneratedCodeRow row in generatedRows)
                {
                    codes.AppendLine(row.Code);
                }
                Clipboard.SetText(codes.ToString().TrimEnd());
                SetStatus(
                    generatedRows.Count == 1
                        ? "授权码已复制到剪贴板。"
                        : String.Format(
                            "已复制 {0} 个授权码，每行一个。",
                            generatedRows.Count),
                    false);
            }
            catch (Exception ex)
            {
                SetStatus("复制失败：" + ex.Message, true);
            }
        }

        private void ExportButton_Click(object sender, EventArgs e)
        {
            if (generatedRows.Count == 0)
            {
                return;
            }

            using (SaveFileDialog dialog = new SaveFileDialog())
            {
                dialog.Title = "导出授权码";
                dialog.Filter = "CSV 文件|*.csv|制表符文本|*.txt";
                dialog.AddExtension = true;
                dialog.FileName = String.Format(
                    "离职赔偿授权码-{0:yyyyMMdd-HHmm}.csv",
                    DateTime.Now);
                if (dialog.ShowDialog(this) != DialogResult.OK)
                {
                    return;
                }

                try
                {
                    bool csv = dialog.FileName.EndsWith(
                        ".csv",
                        StringComparison.OrdinalIgnoreCase);
                    File.WriteAllText(
                        dialog.FileName,
                        BuildExportContent(csv, generatedRows),
                        new UTF8Encoding(true));
                    SetStatus("导出成功：" + dialog.FileName, false);
                }
                catch (Exception ex)
                {
                    SetStatus("导出失败：" + ex.Message, true);
                }
            }
        }

        private static string BuildExportContent(
            bool csv,
            List<GeneratedCodeRow> rows)
        {
            StringBuilder content = new StringBuilder();
            if (csv)
            {
                content.AppendLine("序号,订单备注,授权码,记录ID,设备上限,有效期,登录地址");
            }
            else
            {
                content.AppendLine("序号\t订单备注\t授权码\t记录ID\t设备上限\t有效期\t登录地址");
            }

            for (int index = 0; index < rows.Count; index += 1)
            {
                GeneratedCodeRow row = rows[index];
                string expires = String.IsNullOrWhiteSpace(row.ExpiresAt)
                    ? "永久"
                    : row.ExpiresAt;
                if (csv)
                {
                    content.AppendLine(
                        String.Join(
                            ",",
                            new string[]
                            {
                                (index + 1).ToString(CultureInfo.InvariantCulture),
                                CsvEscape(row.Label),
                                CsvEscape(row.Code),
                                CsvEscape(row.Id),
                                row.MaxDevices.ToString(CultureInfo.InvariantCulture),
                                CsvEscape(expires),
                                CsvEscape(LoginUrl)
                            }));
                }
                else
                {
                    content.AppendLine(
                        String.Join(
                            "\t",
                            new string[]
                            {
                                (index + 1).ToString(CultureInfo.InvariantCulture),
                                row.Label,
                                row.Code,
                                row.Id,
                                row.MaxDevices.ToString(CultureInfo.InvariantCulture),
                                expires,
                                LoginUrl
                            }));
                }
            }

            return content.ToString();
        }

        private bool TryBuildGenerateCommand(
            out string remoteCommand,
            out string validationError)
        {
            remoteCommand = null;
            validationError = null;

            string label = labelBox.Text.Trim();
            if (String.IsNullOrWhiteSpace(label))
            {
                validationError = "请填写订单备注或用途。";
                return false;
            }
            if (label.Length > 100 || ContainsControlCharacter(label))
            {
                validationError = "订单备注不能超过 100 个字符，也不能包含换行或控制字符。";
                return false;
            }

            int count = Decimal.ToInt32(quantityBox.Value);
            if (count > 1 && label.Length > 90)
            {
                validationError = "批量生成时订单备注不能超过 90 个字符，以便追加序号。";
                return false;
            }
            string customCode = customCodeBox.Text.Trim();
            if (count == 1 &&
                !String.IsNullOrEmpty(customCode) &&
                !System.Text.RegularExpressions.Regex.IsMatch(
                    customCode,
                    "^[A-Za-z0-9-]{8,64}$"))
            {
                validationError = "自定义授权码只能使用字母、数字和短横线，长度为 8 到 64 位。";
                return false;
            }

            if (!ValidateConnectionSettings(out validationError))
            {
                return false;
            }

            string expiresAt = null;
            if (expiryCheckBox.Checked)
            {
                DateTime expiry = expiryPicker.Value;
                if (expiry <= DateTime.Now.AddMinutes(5))
                {
                    validationError = "有效期必须晚于当前时间至少 5 分钟。";
                    return false;
                }
                DateTimeOffset offset = new DateTimeOffset(expiry);
                expiresAt = offset.ToString("yyyy-MM-dd'T'HH:mm:sszzz", CultureInfo.InvariantCulture);
            }

            remoteCommand =
                count == 1
                    ? BuildRemoteCreateCommand(label, customCode, expiresAt)
                    : BuildRemoteBatchCommand(label, count, expiresAt);
            return true;
        }

        private bool ValidateConnectionSettings(out string error)
        {
            error = null;
            string keyPath = keyPathBox.Text.Trim();
            if (String.IsNullOrWhiteSpace(keyPath) || !File.Exists(keyPath))
            {
                error = "找不到 SSH 私钥文件，请选择正确的密钥路径。";
                return false;
            }
            if (String.IsNullOrWhiteSpace(hostBox.Text))
            {
                error = "请填写服务器地址。";
                return false;
            }
            if (!System.Text.RegularExpressions.Regex.IsMatch(
                userBox.Text.Trim(),
                "^[A-Za-z0-9._-]+$"))
            {
                error = "SSH 用户名格式不正确。";
                return false;
            }
            return true;
        }

        public static string BuildRemoteCreateCommand(
            string label,
            string customCode,
            string expiresAt)
        {
            StringBuilder command = new StringBuilder();
            command.Append("sudo lizhipeichang-h5-admin create --label ");
            command.Append(ShellQuote(label));

            if (!String.IsNullOrWhiteSpace(customCode))
            {
                command.Append(" --code ");
                command.Append(ShellQuote(customCode));
            }

            if (!String.IsNullOrWhiteSpace(expiresAt))
            {
                command.Append(" --expires ");
                command.Append(ShellQuote(expiresAt));
            }

            command.Append(" --format json");
            return command.ToString();
        }

        public static string BuildRemoteBatchCommand(
            string labelPrefix,
            int count,
            string expiresAt)
        {
            StringBuilder command = new StringBuilder();
            command.Append("sudo lizhipeichang-h5-admin create-batch --prefix ");
            command.Append(ShellQuote(labelPrefix));
            command.Append(" --count ");
            command.Append(count.ToString(CultureInfo.InvariantCulture));

            if (!String.IsNullOrWhiteSpace(expiresAt))
            {
                command.Append(" --expires ");
                command.Append(ShellQuote(expiresAt));
            }

            command.Append(" --format json");
            return command.ToString();
        }

        private ProcessResult RunSsh(string remoteCommand)
        {
            ProcessStartInfo startInfo = new ProcessStartInfo();
            startInfo.FileName = FindSshExecutable();
            startInfo.Arguments = BuildSshArguments(remoteCommand);
            startInfo.UseShellExecute = false;
            startInfo.CreateNoWindow = true;
            startInfo.RedirectStandardOutput = true;
            startInfo.RedirectStandardError = true;
            startInfo.StandardOutputEncoding = Encoding.UTF8;
            startInfo.StandardErrorEncoding = Encoding.UTF8;

            using (Process process = new Process())
            {
                process.StartInfo = startInfo;
                if (!process.Start())
                {
                    throw new InvalidOperationException("无法启动 SSH 客户端。");
                }

                Task<string> outputTask = process.StandardOutput.ReadToEndAsync();
                Task<string> errorTask = process.StandardError.ReadToEndAsync();
                if (!process.WaitForExit(60000))
                {
                    try
                    {
                        process.Kill();
                    }
                    catch
                    {
                        // Ignore termination failure and report the timeout.
                    }
                    throw new TimeoutException("SSH 操作超过 60 秒，请检查网络或服务器状态。");
                }

                Task.WaitAll(outputTask, errorTask);
                return new ProcessResult
                {
                    ExitCode = process.ExitCode,
                    StandardOutput = outputTask.Result,
                    StandardError = errorTask.Result
                };
            }
        }

        private string BuildSshArguments(string remoteCommand)
        {
            StringBuilder arguments = new StringBuilder();
            arguments.Append("-i ");
            arguments.Append(QuoteWindowsArgument(keyPathBox.Text.Trim()));
            arguments.Append(" -o BatchMode=yes");
            arguments.Append(" -o ConnectTimeout=15");
            arguments.Append(" -o StrictHostKeyChecking=accept-new");
            arguments.Append(" -o LogLevel=ERROR ");
            arguments.Append(QuoteWindowsArgument(userBox.Text.Trim()));
            arguments.Append("@");
            arguments.Append(hostBox.Text.Trim());
            arguments.Append(" ");
            arguments.Append(QuoteWindowsArgument(remoteCommand));
            return arguments.ToString();
        }

        private static string FindSshExecutable()
        {
            string windows = Environment.GetFolderPath(Environment.SpecialFolder.Windows);
            string bundled = Path.Combine(windows, "System32", "OpenSSH", "ssh.exe");
            return File.Exists(bundled) ? bundled : "ssh.exe";
        }

        private static string GetFriendlySshError(ProcessResult result)
        {
            string details = String.IsNullOrWhiteSpace(result.StandardError)
                ? result.StandardOutput.Trim()
                : result.StandardError.Trim();
            if (details.IndexOf("Permission denied", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return "SSH 私钥未被服务器接受，请确认密钥文件和用户名。";
            }
            if (details.IndexOf("Connection timed out", StringComparison.OrdinalIgnoreCase) >= 0 ||
                details.IndexOf("timed out", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                return "无法连接服务器，请检查网络和 22 端口防火墙。";
            }
            return String.IsNullOrWhiteSpace(details)
                ? "服务器返回错误，操作未完成。"
                : Truncate(details.Replace("\r", "").Replace("\n", " "), 180);
        }

        private void RenderGeneratedRows()
        {
            StringBuilder display = new StringBuilder();
            foreach (GeneratedCodeRow row in generatedRows)
            {
                display.Append(row.Code);
                display.Append("  |  ");
                display.AppendLine(row.Label);
            }

            generatedCodeBox.Text = display.ToString().TrimEnd();
            generatedCodeBox.ForeColor = Ink;

            if (generatedRows.Count == 1)
            {
                GeneratedCodeRow row = generatedRows[0];
                resultMetaLabel.Text = String.Format(
                    "记录 ID：{0}    设备上限：{1} 台    有效期：{2}",
                    row.Id,
                    row.MaxDevices,
                    String.IsNullOrWhiteSpace(row.ExpiresAt) ? "永久" : row.ExpiresAt);
            }
            else
            {
                resultMetaLabel.Text = String.Format(
                    "共 {0} 个授权码，每个最多 2 台设备。请导出 CSV 保存。",
                    generatedRows.Count);
            }
        }

        private static List<GeneratedCodeRow> ParseGeneratedRows(string output)
        {
            string trimmed = (output ?? String.Empty).Trim();
            List<GeneratedCodeRow> rows = new List<GeneratedCodeRow>();
            if (String.IsNullOrEmpty(trimmed))
            {
                return rows;
            }

            if (trimmed.StartsWith("[", StringComparison.Ordinal) ||
                trimmed.StartsWith("{", StringComparison.Ordinal))
            {
                byte[] jsonBytes = Encoding.UTF8.GetBytes(trimmed);
                using (MemoryStream stream = new MemoryStream(jsonBytes))
                {
                    if (trimmed.StartsWith("[", StringComparison.Ordinal))
                    {
                        DataContractJsonSerializer serializer =
                            new DataContractJsonSerializer(typeof(List<GeneratedCodeDto>));
                        List<GeneratedCodeDto> items =
                            serializer.ReadObject(stream) as List<GeneratedCodeDto>;
                        if (items != null)
                        {
                            foreach (GeneratedCodeDto item in items)
                            {
                                rows.Add(ParseGeneratedRow(item));
                            }
                        }
                        return rows;
                    }
                    else
                    {
                        DataContractJsonSerializer serializer =
                            new DataContractJsonSerializer(typeof(GeneratedCodeDto));
                        GeneratedCodeDto item =
                            serializer.ReadObject(stream) as GeneratedCodeDto;
                        if (item != null)
                        {
                            rows.Add(ParseGeneratedRow(item));
                        }
                        return rows;
                    }
                }
            }

            Dictionary<string, string> fields = ParseKeyValueOutput(trimmed);
            string code;
            if (fields.TryGetValue("code", out code) && !String.IsNullOrWhiteSpace(code))
            {
                string id;
                string label;
                string expiresAt;
                string maxDevices;
                fields.TryGetValue("id", out id);
                fields.TryGetValue("label", out label);
                fields.TryGetValue("expiresAt", out expiresAt);
                fields.TryGetValue("maxDevices", out maxDevices);
                int parsedMaxDevices = 2;
                Int32.TryParse(maxDevices, out parsedMaxDevices);
                rows.Add(new GeneratedCodeRow
                {
                    Id = id ?? String.Empty,
                    Code = code,
                    Label = label ?? String.Empty,
                    MaxDevices = parsedMaxDevices,
                    ExpiresAt = expiresAt == "never" ? String.Empty : expiresAt
                });
            }
            return rows;
        }

        private static GeneratedCodeRow ParseGeneratedRow(GeneratedCodeDto values)
        {
            if (String.IsNullOrWhiteSpace(values.Code))
            {
                throw new InvalidOperationException("服务器结果缺少授权码字段。");
            }

            return new GeneratedCodeRow
            {
                Id = values.Id ?? String.Empty,
                Code = values.Code,
                Label = values.Label ?? String.Empty,
                MaxDevices = values.MaxDevices > 0 ? values.MaxDevices : 2,
                ExpiresAt = values.ExpiresAt ?? String.Empty
            };
        }

        private static string CsvEscape(string value)
        {
            string text = value ?? String.Empty;
            if (text.IndexOfAny(new char[] { ',', '"', '\r', '\n' }) < 0)
            {
                return text;
            }
            return "\"" + text.Replace("\"", "\"\"") + "\"";
        }

        private static Dictionary<string, string> ParseKeyValueOutput(string output)
        {
            Dictionary<string, string> values = new Dictionary<string, string>(
                StringComparer.OrdinalIgnoreCase);
            string[] lines = (output ?? String.Empty).Replace("\r", "").Split('\n');
            foreach (string line in lines)
            {
                int separator = line.IndexOf('=');
                if (separator <= 0)
                {
                    continue;
                }
                string key = line.Substring(0, separator).Trim();
                string value = line.Substring(separator + 1).Trim();
                values[key] = value;
            }
            return values;
        }

        private void SetBusy(bool busy, string message)
        {
            generateButton.Enabled = !busy;
            testButton.Enabled = !busy;
            generateButton.Text = busy ? "正在生成..." : String.Empty;
            if (!busy)
            {
                UpdateGenerateButtonText();
            }
            if (message != null)
            {
                SetStatus(message, false);
            }
        }

        private void SetStatus(string message, bool isError)
        {
            statusLabel.Text = message ?? String.Empty;
            statusLabel.ForeColor = isError ? Warm : BrandDark;
        }

        private static bool ContainsControlCharacter(string value)
        {
            foreach (char character in value)
            {
                if (Char.IsControl(character))
                {
                    return true;
                }
            }
            return false;
        }

        private static string ShellQuote(string value)
        {
            return "'" + (value ?? String.Empty).Replace("'", "'\"'\"'") + "'";
        }

        private static string QuoteWindowsArgument(string value)
        {
            if (String.IsNullOrEmpty(value))
            {
                return "\"\"";
            }
            if (value.IndexOfAny(new char[] { ' ', '\t', '\n', '\v', '"' }) < 0)
            {
                return value;
            }

            StringBuilder quoted = new StringBuilder();
            quoted.Append('"');
            int backslashes = 0;
            foreach (char character in value)
            {
                if (character == '\\')
                {
                    backslashes += 1;
                    continue;
                }
                if (character == '"')
                {
                    quoted.Append('\\', backslashes * 2 + 1);
                    quoted.Append('"');
                    backslashes = 0;
                    continue;
                }
                quoted.Append('\\', backslashes);
                backslashes = 0;
                quoted.Append(character);
            }
            quoted.Append('\\', backslashes * 2);
            quoted.Append('"');
            return quoted.ToString();
        }

        private static string Truncate(string value, int maxLength)
        {
            if (String.IsNullOrEmpty(value) || value.Length <= maxLength)
            {
                return value;
            }
            return value.Substring(0, maxLength - 1) + "…";
        }

        private static void SetPlaceholder(TextBox box, string text)
        {
            SendMessage(box.Handle, EmSetCueBanner, new IntPtr(1), text);
        }

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        private static extern IntPtr SendMessage(
            IntPtr hWnd,
            int message,
            IntPtr wParam,
            string lParam);

        private sealed class ProcessResult
        {
            public int ExitCode { get; set; }
            public string StandardOutput { get; set; }
            public string StandardError { get; set; }
        }

        private sealed class GeneratedCodeRow
        {
            public string Id { get; set; }
            public string Code { get; set; }
            public string Label { get; set; }
            public int MaxDevices { get; set; }
            public string ExpiresAt { get; set; }
        }

        [DataContract]
        private sealed class GeneratedCodeDto
        {
            [DataMember(Name = "id")]
            public string Id { get; set; }

            [DataMember(Name = "code")]
            public string Code { get; set; }

            [DataMember(Name = "label")]
            public string Label { get; set; }

            [DataMember(Name = "maxDevices")]
            public int MaxDevices { get; set; }

            [DataMember(Name = "expiresAt")]
            public string ExpiresAt { get; set; }
        }
    }

    internal enum ButtonKind
    {
        Primary,
        Secondary
    }

    internal sealed class RoundedButton : Button
    {
        private static readonly Color Brand = Color.FromArgb(15, 118, 110);
        private static readonly Color BrandDark = Color.FromArgb(17, 94, 89);

        private bool hovered;
        private bool pressed;

        public ButtonKind Kind { get; set; }

        public RoundedButton()
        {
            SetStyle(
                ControlStyles.AllPaintingInWmPaint |
                ControlStyles.UserPaint |
                ControlStyles.OptimizedDoubleBuffer |
                ControlStyles.ResizeRedraw,
                true);
            FlatStyle = FlatStyle.Flat;
            FlatAppearance.BorderSize = 0;
            Cursor = Cursors.Hand;
            TabStop = true;
            UseVisualStyleBackColor = false;
        }

        protected override void OnMouseEnter(EventArgs e)
        {
            hovered = true;
            Invalidate();
            base.OnMouseEnter(e);
        }

        protected override void OnMouseLeave(EventArgs e)
        {
            hovered = false;
            pressed = false;
            Invalidate();
            base.OnMouseLeave(e);
        }

        protected override void OnMouseDown(MouseEventArgs mevent)
        {
            pressed = true;
            Invalidate();
            base.OnMouseDown(mevent);
        }

        protected override void OnMouseUp(MouseEventArgs mevent)
        {
            pressed = false;
            Invalidate();
            base.OnMouseUp(mevent);
        }

        protected override void OnPaint(PaintEventArgs pevent)
        {
            pevent.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            Color background;
            Color foreground;
            Color border;

            if (Kind == ButtonKind.Primary)
            {
                background = !Enabled
                    ? Color.FromArgb(148, 182, 180)
                    : pressed
                        ? Color.FromArgb(13, 100, 94)
                        : hovered
                            ? BrandDark
                            : Brand;
                foreground = Color.White;
                border = background;
            }
            else
            {
                background = !Enabled
                    ? Color.FromArgb(248, 250, 252)
                    : pressed
                        ? Color.FromArgb(226, 240, 238)
                        : hovered
                            ? Color.FromArgb(236, 249, 247)
                            : Color.White;
                foreground = !Enabled ? Color.FromArgb(148, 163, 184) : BrandDark;
                border = Color.FromArgb(180, 213, 209);
            }

            Rectangle bounds = new Rectangle(0, 0, Width - 1, Height - 1);
            using (GraphicsPath path = RoundedRectangle(bounds, 8))
            using (SolidBrush brush = new SolidBrush(background))
            using (Pen pen = new Pen(border))
            {
                pevent.Graphics.FillPath(brush, path);
                pevent.Graphics.DrawPath(pen, path);
            }

            TextRenderer.DrawText(
                pevent.Graphics,
                Text,
                Font,
                bounds,
                foreground,
                TextFormatFlags.HorizontalCenter |
                TextFormatFlags.VerticalCenter |
                TextFormatFlags.SingleLine |
                TextFormatFlags.EndEllipsis);
        }

        internal static GraphicsPath RoundedRectangle(Rectangle bounds, int radius)
        {
            int diameter = radius * 2;
            GraphicsPath path = new GraphicsPath();
            path.AddArc(bounds.X, bounds.Y, diameter, diameter, 180, 90);
            path.AddArc(bounds.Right - diameter, bounds.Y, diameter, diameter, 270, 90);
            path.AddArc(bounds.Right - diameter, bounds.Bottom - diameter, diameter, diameter, 0, 90);
            path.AddArc(bounds.X, bounds.Bottom - diameter, diameter, diameter, 90, 90);
            path.CloseFigure();
            return path;
        }
    }

    internal sealed class SurfacePanel : Panel
    {
        public Color BorderColor { get; set; }
        public int Radius { get; set; }

        public SurfacePanel()
        {
            SetStyle(
                ControlStyles.AllPaintingInWmPaint |
                ControlStyles.UserPaint |
                ControlStyles.OptimizedDoubleBuffer |
                ControlStyles.ResizeRedraw,
                true);
            Radius = 10;
            BorderColor = Color.FromArgb(219, 227, 232);
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            base.OnPaint(e);
            e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
            Rectangle bounds = new Rectangle(0, 0, Width - 1, Height - 1);
            using (GraphicsPath path = RoundedButton.RoundedRectangle(bounds, Radius))
            using (Pen pen = new Pen(BorderColor))
            {
                e.Graphics.DrawPath(pen, path);
            }
        }
    }
}
