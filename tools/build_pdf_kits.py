from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "downloads"
FONT_REGULAR = Path(r"C:\Windows\Fonts\Deng.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\Dengb.ttf")

INK = colors.HexColor("#1F2937")
MUTED = colors.HexColor("#4B5563")
TEAL = colors.HexColor("#0F766E")
TEAL_DARK = colors.HexColor("#115E59")
TEAL_LIGHT = colors.HexColor("#E6FFFA")
AMBER = colors.HexColor("#B45309")
AMBER_LIGHT = colors.HexColor("#FFF7ED")
PAPER = colors.HexColor("#F8FAFC")
BORDER = colors.HexColor("#D9D9D9")
WHITE = colors.white


pdfmetrics.registerFont(TTFont("DengXian", str(FONT_REGULAR)))
pdfmetrics.registerFont(TTFont("DengXian-Bold", str(FONT_BOLD)))
pdfmetrics.registerFontFamily(
    "DengXian",
    normal="DengXian",
    bold="DengXian-Bold",
    italic="DengXian",
    boldItalic="DengXian-Bold",
)


STYLES = getSampleStyleSheet()
BODY = ParagraphStyle(
    "BodyCN",
    parent=STYLES["BodyText"],
    fontName="DengXian",
    fontSize=9.2,
    leading=14,
    textColor=INK,
    spaceAfter=5,
)
TITLE = ParagraphStyle(
    "TitleCN",
    parent=STYLES["Title"],
    fontName="DengXian-Bold",
    fontSize=20,
    leading=26,
    textColor=colors.black,
    alignment=TA_LEFT,
    spaceAfter=4,
)
SUBTITLE = ParagraphStyle(
    "SubtitleCN",
    parent=BODY,
    fontName="DengXian-Bold",
    fontSize=10.5,
    leading=15,
    textColor=MUTED,
    spaceAfter=8,
)
SECTION = ParagraphStyle(
    "SectionCN",
    parent=BODY,
    fontName="DengXian-Bold",
    fontSize=11.5,
    leading=16,
    textColor=colors.black,
    spaceAfter=2,
)
SMALL = ParagraphStyle(
    "SmallCN",
    parent=BODY,
    fontSize=7.8,
    leading=11.5,
    textColor=MUTED,
)
ITEM = ParagraphStyle(
    "ItemCN",
    parent=BODY,
    fontSize=8.8,
    leading=13,
    spaceAfter=0,
)
CARD_TITLE = ParagraphStyle(
    "CardTitleCN",
    parent=BODY,
    fontName="DengXian-Bold",
    fontSize=10.2,
    leading=15,
    spaceAfter=4,
)
CARD_BODY = ParagraphStyle(
    "CardBodyCN",
    parent=BODY,
    fontSize=9.1,
    leading=15,
    spaceAfter=0,
)


def draw_page_frame(canvas, document, footer_label):
    width, height = A4
    canvas.saveState()
    canvas.setStrokeColor(BORDER)
    canvas.setLineWidth(0.55)
    canvas.line(18 * mm, 15 * mm, width - 18 * mm, 15 * mm)
    canvas.setFont("DengXian", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 10 * mm, f"离职赔偿计算系统  |  {footer_label}")
    canvas.drawRightString(width - 18 * mm, 10 * mm, f"第 {document.page} 页")
    canvas.restoreState()


def build_document(path, title):
    return SimpleDocTemplate(
        str(path),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=17 * mm,
        bottomMargin=19 * mm,
        title=title,
        author="离职赔偿计算系统",
        subject="离职准备工具",
    )


def heading_block(title, subtitle):
    return [
        Paragraph(title, TITLE),
        Paragraph(subtitle, SUBTITLE),
        Spacer(1, 3),
    ]


def category_header(number, title):
    return Table(
        [[Paragraph(f"{number}. {title}", ParagraphStyle(
            "CategoryWhite",
            parent=SECTION,
            textColor=WHITE,
            fontSize=10.5,
            leading=14,
            spaceAfter=0,
        ))]],
        colWidths=[174 * mm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), TEAL),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        ),
    )


def checklist_table(items):
    rows = [[Paragraph(f"□&nbsp;&nbsp;{item}", ITEM)] for item in items]
    return Table(
        rows,
        colWidths=[174 * mm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), WHITE),
                ("BACKGROUND", (0, 0), (-1, 0), PAPER),
                ("BACKGROUND", (0, 2), (-1, 2), PAPER),
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.35, BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]
        ),
    )


def save_tip(text):
    return Table(
        [[Paragraph(f"<b>保存要点：</b>{text}", SMALL)]],
        colWidths=[174 * mm],
        style=TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), AMBER_LIGHT),
                ("BOX", (0, 0), (-1, -1), 0.45, colors.HexColor("#FED7AA")),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        ),
    )


def evidence_category(number, title, items, tip):
    return KeepTogether(
        [
            category_header(number, title),
            checklist_table(items),
            Spacer(1, 3),
            save_tip(tip),
            Spacer(1, 8),
        ]
    )


def build_evidence_checklist():
    output = OUTPUT_DIR / "evidence-checklist.pdf"
    document = build_document(output, "离职争议证据保存清单")
    story = heading_block(
        "离职争议证据保存清单",
        "6 类证据与保存时限提醒",
    )
    story.extend(
        [
            Paragraph(
                "本清单用于离职谈判、仲裁咨询或自行整理材料前进行第一轮准备。"
                "先保存原始文件和导出记录，再建立目录。证据是否被采纳，由仲裁机构或法院结合案件事实判断。",
                BODY,
            ),
            Table(
                [[
                    Paragraph("先保留原件", CARD_TITLE),
                    Paragraph("再做目录", CARD_TITLE),
                    Paragraph("保留两处备份", CARD_TITLE),
                ], [
                    Paragraph("不修改原图、原录音和原始邮件。", SMALL),
                    Paragraph("按日期、类别和争议事项命名。", SMALL),
                    Paragraph("公司账号关闭前完成导出。", SMALL),
                ]],
                colWidths=[58 * mm, 58 * mm, 58 * mm],
                style=TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), TEAL_LIGHT),
                        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                        ("INNERGRID", (0, 0), (-1, -1), 0.35, BORDER),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("LEFTPADDING", (0, 0), (-1, -1), 8),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                        ("TOPPADDING", (0, 0), (-1, -1), 6),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ]
                ),
            ),
            Spacer(1, 10),
        ]
    )

    story.extend(
        [
            evidence_category(
                "1",
                "劳动关系与岗位",
                [
                    "劳动合同、续签、变更、附件和岗位说明书。",
                    "Offer、入职登记、工牌、门禁、通讯录或组织架构记录。",
                    "工资流水、工资条、个税、社保和公积金记录。",
                    "考勤、排班、加班审批、请假和出差记录。",
                ],
                "在账号权限关闭前导出。工资和社保至少保存能覆盖争议期间的完整月份。",
            ),
            evidence_category(
                "2",
                "解除通知与送达",
                [
                    "解除或终止劳动合同通知书、签收、快递和邮件记录。",
                    "短信、微信、企业微信、钉钉或其他聊天记录。",
                    "会议通知、会议纪要、谈话录音和参会人员记录。",
                    "公司说明的解除理由、程序、依据和补偿计算表。",
                ],
                "收到通知当天开始保存。录音保留原始文件，不要只保留转写稿或二次转发文件。",
            ),
            evidence_category(
                "3",
                "工资与补偿",
                [
                    "离职前十二个月工资条、银行流水和收入证明。",
                    "奖金、提成、津贴、补贴、报销规则和发放记录。",
                    "补偿方案、计算表、协议草稿、欠条或付款承诺。",
                    "工资、补偿和报销的到账记录与对应凭证。",
                ],
                "保存完整月份并核对金额。分期支付时，把每期金额、日期和违约处理一并留存。",
            ),
            PageBreak(),
            evidence_category(
                "4",
                "绩效、培训与制度",
                [
                    "岗位职责、绩效标准、考核结果和改进计划。",
                    "培训、调岗、警告、处分和员工手册签收记录。",
                    "规章制度公示、培训签到和适用版本。",
                    "公司主张不能胜任或严重违纪时对应的证据材料。",
                ],
                "如材料由公司掌握，先书面申请复制或查阅；同时保存你手中的版本和收到时间。",
            ),
            evidence_category(
                "5",
                "沟通与协商",
                [
                    "微信、企业微信、钉钉、邮件、会议邀请和日历记录。",
                    "录音、会议纪要、补偿方案修改稿和对方回复。",
                    "沟通时间、地点、参与人以及每个人表达的主要意思。",
                    "协议谈判中的修改痕迹、版本号和发送记录。",
                ],
                "保留上下文和附件。不要删改原聊天记录，不要只截取对自己有利的一段。",
            ),
            evidence_category(
                "6",
                "公司信息与交接",
                [
                    "营业执照信息、法定代表人、办公地址和实际工作地点。",
                    "工作交接单、设备归还、门禁和系统权限关闭记录。",
                    "离职证明、社保转移、档案和公积金材料。",
                    "工资、补偿、报销和未结款项的支付凭据。",
                ],
                "最后工作日完成清单，并让公司签收或以邮件、聊天方式书面确认。",
            ),
            Spacer(1, 10),
            Paragraph("保存时限与程序提醒", SECTION),
            Spacer(1, 4),
            Paragraph(
                "• 立即保存：通知、聊天、邮件、录音、工资和考勤记录。"
                "离职后公司账号可能被关闭，事后补取会更困难。",
                BODY,
            ),
            Paragraph(
                "• 离职前保存：工资流水、社保、公积金、绩效、培训、调岗、交接和离职证明。"
                "重要文件至少保留两份备份。",
                BODY,
            ),
            Paragraph(
                "• 仲裁时效：劳动争议申请仲裁通常受一年时效限制，自知道或者应当知道权利被侵害之日起计算；"
                "劳动报酬等请求存在特别规则。具体起算点应结合事实核对《劳动争议调解仲裁法》第 27 条和当地口径。",
                BODY,
            ),
            Paragraph(
                "• 管辖和费用：劳动争议通常由劳动合同履行地或者用人单位所在地的仲裁委员会管辖，"
                "劳动争议仲裁一般不收费。相关规定可核对《劳动争议调解仲裁法》第 21 条和第 53 条。",
                BODY,
            ),
            Spacer(1, 4),
            Paragraph(
                "本清单只用于整理第一轮材料，不构成正式法律意见。原始证据的真实性、完整性和取得方式，"
                "仍需由仲裁机构、法院或专业律师结合案件判断。",
                SMALL,
            ),
        ]
    )

    document.build(
        story,
        onFirstPage=lambda canvas, doc: draw_page_frame(
            canvas, doc, "离职争议证据保存清单"
        ),
        onLaterPages=lambda canvas, doc: draw_page_frame(
            canvas, doc, "离职争议证据保存清单"
        ),
    )
    return output


def negotiation_card(number, title, body):
    return [
        Paragraph(f"{number:02d}", ParagraphStyle(
            "CardNumber",
            parent=CARD_TITLE,
            textColor=TEAL,
            fontSize=9,
            leading=12,
            spaceAfter=3,
        )),
        Paragraph(title, CARD_TITLE),
        Paragraph(body, CARD_BODY),
    ]


def build_negotiation_cards():
    output = OUTPUT_DIR / "negotiation-cards.pdf"
    document = build_document(output, "离职谈判话术卡")
    story = heading_block(
        "离职谈判话术卡",
        "6 个表达，先把事实、程序和计算讲清楚",
    )
    story.extend(
        [
            Paragraph(
                "在协商、会议或书面回复前，先整理日期、工资、解除理由和证据。"
                "下面的表达可以按事实改写，语气保持平稳，避免把推测说成确定结论。",
                BODY,
            ),
            Spacer(1, 7),
        ]
    )

    cards = [
        ("先确认再讨论", "我先确认公司给出的解除依据、程序和书面文件，再讨论具体方案。"),
        ("要求书面依据", "请把解除理由、适用条款、通知日期和补偿计算方式写进书面文件。"),
        ("不能胜任", "如果公司主张不能胜任，请提供考核标准、培训或调岗记录，以及仍不能胜任的证据。"),
        ("工资基数", "请按离职前十二个月平均应得工资列出工资、奖金、津贴和补贴明细。"),
        ("违法解除", "如果双方对解除合法性有争议，我需要先了解继续履行合同和主张赔偿金两种路径的差别。"),
        ("签字之前", "在核对金额、支付时间、社保和权利处分条款前，我不会签署空白协议或当场作出最终确认。"),
    ]

    rows = []
    for index in range(0, len(cards), 2):
        row_cards = []
        for card_index in range(2):
            number = index + card_index + 1
            title, body = cards[index + card_index]
            row_cards.append(negotiation_card(number, title, body))
        rows.append(row_cards)

    cards_table = Table(
        rows,
        colWidths=[87 * mm, 87 * mm],
        rowHeights=[54 * mm] * 3,
        style=TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("BACKGROUND", (0, 0), (0, 0), TEAL_LIGHT),
                ("BACKGROUND", (1, 1), (1, 1), TEAL_LIGHT),
                ("BACKGROUND", (0, 2), (0, 2), TEAL_LIGHT),
                ("LEFTPADDING", (0, 0), (-1, -1), 13),
                ("RIGHTPADDING", (0, 0), (-1, -1), 13),
                ("TOPPADDING", (0, 0), (-1, -1), 12),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]
        ),
    )
    story.append(cards_table)
    story.extend(
        [
            Spacer(1, 12),
            Paragraph("谈判前准备好三件事", SECTION),
            Spacer(1, 4),
            Table(
                [[
                    Paragraph("1. 一个区间", CARD_TITLE),
                    Paragraph("2. 一组依据", CARD_TITLE),
                    Paragraph("3. 一套证据", CARD_TITLE),
                ], [
                    Paragraph("用自己的工作年限和工资做出基准金额，记录与公司方案的差额。", SMALL),
                    Paragraph("把解除理由、通知日期、法条摘要和计算明细放在同一份文件中。", SMALL),
                    Paragraph("把通知、工资、考勤、绩效和沟通记录按目录整理并备份。", SMALL),
                ]],
                colWidths=[58 * mm, 58 * mm, 58 * mm],
                style=TableStyle(
                    [
                        ("BOX", (0, 0), (-1, -1), 0.5, BORDER),
                        ("INNERGRID", (0, 0), (-1, -1), 0.35, BORDER),
                        ("BACKGROUND", (0, 0), (-1, 0), PAPER),
                        ("LEFTPADDING", (0, 0), (-1, -1), 8),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                        ("TOPPADDING", (0, 0), (-1, -1), 7),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ]
                ),
            ),
            Spacer(1, 10),
            Paragraph(
                "这些话术用于帮助你表达核对需求，不构成正式法律意见。"
                "如果公司已经拒绝沟通、要求立即签字或存在复杂证据争议，请尽快咨询当地劳动仲裁机构或律师。",
                SMALL,
            ),
        ]
    )

    document.build(
        story,
        onFirstPage=lambda canvas, doc: draw_page_frame(
            canvas, doc, "离职谈判话术卡"
        ),
        onLaterPages=lambda canvas, doc: draw_page_frame(
            canvas, doc, "离职谈判话术卡"
        ),
    )
    return output


def timeline_row(step, title, detail):
    return [
        Paragraph(step, ParagraphStyle(
            "TimelineStep",
            parent=BODY,
            fontName="DengXian-Bold",
            fontSize=8.2,
            leading=12,
            textColor=TEAL_DARK,
            alignment=TA_CENTER,
            spaceAfter=0,
        )),
        Paragraph("●", ParagraphStyle(
            "TimelineDot",
            parent=BODY,
            fontSize=8,
            leading=12,
            textColor=TEAL,
            alignment=TA_CENTER,
            spaceAfter=0,
        )),
        [
            Paragraph(title, ParagraphStyle(
                "TimelineTitle",
                parent=CARD_TITLE,
                fontSize=9.7,
                leading=13,
                spaceAfter=2,
            )),
            Paragraph(detail, ParagraphStyle(
                "TimelineBody",
                parent=BODY,
                fontSize=8.5,
                leading=12,
                spaceAfter=0,
            )),
        ],
    ]


def build_process_timeline():
    output = OUTPUT_DIR / "process-timeline.pdf"
    document = build_document(output, "离职流程时间轴")
    story = heading_block(
        "离职流程时间轴",
        "从收到通知到仲裁时效，一页纸先做行动排序",
    )
    story.extend(
        [
            Paragraph(
                "这是一条用于行动排序的时间轴，不是每个案件都必须逐日完成的法定流程。"
                "先保存事实和证据，再核对解除依据和金额。",
                BODY,
            ),
            Spacer(1, 7),
        ]
    )

    rows = [
        timeline_row(
            "第 0 天",
            "收到通知",
            "记录通知人、时间、地点和理由；要求公司提供书面通知，不急于签署最终协议。",
        ),
        timeline_row(
            "当天",
            "固定事实",
            "保存通知、邮件、短信、聊天和录音；记录账号权限和办公地点，不删除原始文件。",
        ),
        timeline_row(
            "24-72 小时",
            "整理材料",
            "收集合同、工资、社保、考勤、绩效、培训和调岗材料；做出自己的 N、N+1、2N 测算。",
        ),
        timeline_row(
            "3-7 天",
            "书面核对",
            "要求公司说明解除依据、计算明细和支付安排；对不清楚的条款书面提问。",
        ),
        timeline_row(
            "签署前",
            "协议自查",
            "逐条核对金额、支付日期、社保、离职证明和权利处分条款；保留完整协议和盖章副本。",
        ),
        timeline_row(
            "最后工作日",
            "完成交接",
            "取得离职证明、未结工资和补偿凭据、社保转移材料；完成设备、门禁和账号交接。",
        ),
        timeline_row(
            "离职后",
            "评估时效",
            "劳动争议仲裁通常受一年时效限制，自知道或者应当知道权利被侵害之日起计算；"
            "劳动报酬等请求存在特别规则，尽快咨询当地机构或律师。",
        ),
    ]

    timeline_table = Table(
        rows,
        colWidths=[27 * mm, 9 * mm, 138 * mm],
        repeatRows=0,
        style=TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("BACKGROUND", (0, 0), (0, -1), TEAL_LIGHT),
                ("LINEBEFORE", (1, 0), (1, -1), 2, TEAL),
                ("LEFTPADDING", (0, 0), (0, -1), 4),
                ("RIGHTPADDING", (0, 0), (0, -1), 4),
                ("LEFTPADDING", (1, 0), (1, -1), 0),
                ("RIGHTPADDING", (1, 0), (1, -1), 0),
                ("LEFTPADDING", (2, 0), (2, -1), 10),
                ("RIGHTPADDING", (2, 0), (2, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("LINEBELOW", (0, 0), (-1, -2), 0.35, BORDER),
            ]
        ),
    )
    story.append(timeline_table)
    story.extend(
        [
            Spacer(1, 9),
            Table(
                [[
                    Paragraph("条件核对：第 40 条 30 日通知", CARD_TITLE),
                ], [
                    Paragraph(
                        "只有医疗期满、不能胜任、客观情况重大变化三种第 40 条情形，"
                        "才需要重点核对公司是否提前 30 日书面通知；未通知时评估 +1，但不要把它当成所有离职的通用步骤。",
                        SMALL,
                    ),
                ], [
                    Paragraph(
                        "金额提醒：2N 与 +1 不能简单相加。"
                        "如公司主张违法解除，先确认 2N 和继续履行合同两种路径，再决定下一步。",
                        SMALL,
                    ),
                ]],
                colWidths=[174 * mm],
                style=TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, -1), AMBER_LIGHT),
                        ("BOX", (0, 0), (-1, -1), 0.45, colors.HexColor("#FED7AA")),
                        ("LINEBELOW", (0, 0), (-1, -2), 0.35, colors.HexColor("#FED7AA")),
                        ("LEFTPADDING", (0, 0), (-1, -1), 8),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                        ("TOPPADDING", (0, 0), (-1, -1), 6),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ]
                ),
            ),
            Spacer(1, 7),
            Paragraph(
                "本时间轴是第一轮行动提示，不构成正式法律意见。"
                "具体解除程序、证据、时效和管辖仍需结合事实核对官方文本和当地裁审口径。",
                SMALL,
            ),
        ]
    )

    document.build(
        story,
        onFirstPage=lambda canvas, doc: draw_page_frame(
            canvas, doc, "离职流程时间轴"
        ),
        onLaterPages=lambda canvas, doc: draw_page_frame(
            canvas, doc, "离职流程时间轴"
        ),
    )
    return output


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    outputs = [
        build_evidence_checklist(),
        build_negotiation_cards(),
        build_process_timeline(),
    ]
    for output in outputs:
        print(output)


if __name__ == "__main__":
    main()
