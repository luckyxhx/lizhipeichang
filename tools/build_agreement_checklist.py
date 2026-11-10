from pathlib import Path

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Mm, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "downloads" / "agreement-checklist.docx"

FONT_NAME = "Microsoft YaHei"
INK = "1F2937"
MUTED = "4B5563"
BORDER = "D9D9D9"
HEADER_FILL = "0F766E"
HEADER_TEXT = "FFFFFF"
ROW_ALT = "F8FAFC"
ACCENT_FILL = "E6FFFA"


def set_run_font(run, size=10.5, bold=False, color=INK):
    run.font.name = FONT_NAME
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = RGBColor.from_string(color)
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), FONT_NAME)


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=60, start=85, bottom=60, end=85):
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)

    for margin_name, value in {
        "top": top,
        "start": start,
        "bottom": bottom,
        "end": end,
    }.items():
        node = tc_mar.find(qn(f"w:{margin_name}"))
        if node is None:
            node = OxmlElement(f"w:{margin_name}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_table_borders(table):
    table_pr = table._tbl.tblPr
    borders = table_pr.first_child_found_in("w:tblBorders")
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        table_pr.append(borders)

    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        node = borders.find(qn(f"w:{edge}"))
        if node is None:
            node = OxmlElement(f"w:{edge}")
            borders.append(node)
        node.set(qn("w:val"), "single")
        node.set(qn("w:sz"), "4")
        node.set(qn("w:space"), "0")
        node.set(qn("w:color"), BORDER)


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    marker = OxmlElement("w:tblHeader")
    marker.set(qn("w:val"), "true")
    tr_pr.append(marker)


def set_row_min_height(row, height_inches=0.38):
    tr_pr = row._tr.get_or_add_trPr()
    height = OxmlElement("w:trHeight")
    height.set(qn("w:val"), str(int(height_inches * 1440)))
    height.set(qn("w:hRule"), "atLeast")
    tr_pr.append(height)


def prevent_row_split(row):
    tr_pr = row._tr.get_or_add_trPr()
    marker = OxmlElement("w:cantSplit")
    marker.set(qn("w:val"), "true")
    tr_pr.append(marker)


def add_page_number_footer(document):
    footer = document.sections[0].footer
    paragraph = footer.paragraphs[0]
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER

    run = paragraph.add_run("仅供第一轮自查，不构成法律意见  |  第 ")
    set_run_font(run, size=8.5, color=MUTED)

    field_begin = OxmlElement("w:fldChar")
    field_begin.set(qn("w:fldCharType"), "begin")
    field_instruction = OxmlElement("w:instrText")
    field_instruction.set(qn("xml:space"), "preserve")
    field_instruction.text = " PAGE "
    field_end = OxmlElement("w:fldChar")
    field_end.set(qn("w:fldCharType"), "end")

    page_run = paragraph.add_run()
    page_run._r.append(field_begin)
    page_run._r.append(field_instruction)
    page_run._r.append(field_end)
    set_run_font(page_run, size=8.5, color=MUTED)

    tail = paragraph.add_run(" 页")
    set_run_font(tail, size=8.5, color=MUTED)


def add_meta_table(document):
    table = document.add_table(rows=2, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table)

    labels = ["协议名称", "收到日期", "拟签署日期", "协议版本"]
    for index, label in enumerate(labels):
        cell = table.cell(0, index)
        set_cell_shading(cell, ACCENT_FILL)
        set_cell_margins(cell)
        paragraph = cell.paragraphs[0]
        paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = paragraph.add_run(label)
        set_run_font(run, size=9, bold=True)

        value_cell = table.cell(1, index)
        set_cell_margins(value_cell)
        value_cell.paragraphs[0].add_run("")
        set_row_min_height(table.rows[1], 0.3)

    widths = [Inches(1.55), Inches(1.25), Inches(1.25), Inches(1.25)]
    for row in table.rows:
        for index, width in enumerate(widths):
            row.cells[index].width = width


def add_checklist_section(document, title, items, page_break_before=False):
    if page_break_before:
        document.add_page_break()

    heading = document.add_paragraph()
    heading.paragraph_format.space_before = Pt(8)
    heading.paragraph_format.space_after = Pt(4)
    heading.paragraph_format.keep_with_next = True
    run = heading.add_run(title)
    set_run_font(run, size=12.5, bold=True, color=INK)

    table = document.add_table(rows=1, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table)

    headers = ["序号", "自查事项", "完成标记", "备注 / 证据位置"]
    for index, header in enumerate(headers):
        cell = table.cell(0, index)
        set_cell_shading(cell, HEADER_FILL)
        set_cell_margins(cell)
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        paragraph = cell.paragraphs[0]
        paragraph.alignment = (
            WD_ALIGN_PARAGRAPH.CENTER if index in (0, 2) else WD_ALIGN_PARAGRAPH.LEFT
        )
        run = paragraph.add_run(header)
        set_run_font(run, size=9.5, bold=True, color=HEADER_TEXT)

    set_repeat_table_header(table.rows[0])
    set_row_min_height(table.rows[0], 0.3)

    for item_index, item in enumerate(items, start=1):
        row = table.add_row()
        set_row_min_height(row, 0.28)
        prevent_row_split(row)
        fill = ROW_ALT if item_index % 2 == 0 else "FFFFFF"

        values = [
            str(item_index),
            item,
            "□ 已核对  □ 需修改\n□ 不适用",
            "",
        ]
        for column_index, value in enumerate(values):
            cell = row.cells[column_index]
            set_cell_shading(cell, fill)
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            paragraph = cell.paragraphs[0]
            paragraph.alignment = (
                WD_ALIGN_PARAGRAPH.CENTER
                if column_index in (0, 2)
                else WD_ALIGN_PARAGRAPH.LEFT
            )
            paragraph.paragraph_format.space_after = Pt(0)
            run = paragraph.add_run(value)
            set_run_font(run, size=8 if column_index == 2 else 8.8)

    widths = [Inches(0.35), Inches(3.4), Inches(1.3), Inches(1.45)]
    for row in table.rows:
        for index, width in enumerate(widths):
            row.cells[index].width = width

    return table


def add_comparison_record(document):
    heading = document.add_paragraph()
    heading.paragraph_format.space_before = Pt(12)
    heading.paragraph_format.space_after = Pt(5)
    heading.paragraph_format.keep_with_next = True
    run = heading.add_run("我的方案对照记录")
    set_run_font(run, size=12.5, bold=True, color=INK)

    table = document.add_table(rows=1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    set_table_borders(table)

    for index, header in enumerate(["记录项目", "填写内容"]):
        cell = table.cell(0, index)
        set_cell_shading(cell, HEADER_FILL)
        set_cell_margins(cell)
        paragraph = cell.paragraphs[0]
        paragraph.alignment = (
            WD_ALIGN_PARAGRAPH.LEFT if index == 1 else WD_ALIGN_PARAGRAPH.CENTER
        )
        run = paragraph.add_run(header)
        set_run_font(run, size=9.5, bold=True, color=HEADER_TEXT)

    set_repeat_table_header(table.rows[0])
    set_row_min_height(table.rows[0], 0.3)

    labels = [
        "我的测算基准金额",
        "公司方案金额",
        "差额及主要原因",
        "尚未解决的争议点",
        "还需要补充的证据",
        "下一步安排和咨询对象",
    ]
    for index, label in enumerate(labels, start=1):
        row = table.add_row()
        set_row_min_height(row, 0.54)
        prevent_row_split(row)
        fill = ROW_ALT if index % 2 == 0 else "FFFFFF"
        for column_index, value in enumerate([label, ""]):
            cell = row.cells[column_index]
            set_cell_shading(cell, fill)
            set_cell_margins(cell)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            paragraph = cell.paragraphs[0]
            paragraph.alignment = (
                WD_ALIGN_PARAGRAPH.LEFT
                if column_index == 1
                else WD_ALIGN_PARAGRAPH.CENTER
            )
            run = paragraph.add_run(value)
            set_run_font(run, size=9.2, bold=column_index == 0)

    for row in table.rows:
        row.cells[0].width = Inches(1.65)
        row.cells[1].width = Inches(4.85)


def build_document():
    document = Document()
    document.core_properties.title = "离职协议与解除协议自查表"
    document.core_properties.subject = "签署离职协议前的逐项自查工具"
    document.core_properties.author = "离职赔偿计算系统"

    section = document.sections[0]
    section.page_width = Mm(210)
    section.page_height = Mm(297)
    section.top_margin = Mm(18)
    section.bottom_margin = Mm(18)
    section.left_margin = Mm(18)
    section.right_margin = Mm(18)

    styles = document.styles
    styles["Normal"].font.name = FONT_NAME
    styles["Normal"].font.size = Pt(10.5)
    styles["Normal"]._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_NAME)
    styles["Normal"].paragraph_format.line_spacing = 1.18
    styles["Normal"].paragraph_format.space_after = Pt(4)

    title = document.add_paragraph(style="Title")
    title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    title.paragraph_format.space_after = Pt(6)
    title_run = title.add_run("离职协议与解除协议自查表")
    set_run_font(title_run, size=20, bold=True, color="000000")

    subtitle = document.add_paragraph()
    subtitle.paragraph_format.space_after = Pt(8)
    subtitle_run = subtitle.add_run("签署前逐项核对，并把需要修改或补充的条款记录下来")
    set_run_font(subtitle_run, size=10.5, bold=True, color=MUTED)

    intro = document.add_paragraph()
    intro.paragraph_format.space_after = Pt(7)
    intro_run = intro.add_run(
        "本表用于签署离职、解除或补偿协议前进行第一轮核对，请以协议原文、通知、工资和社保记录为准。"
        "勾选“已核对”只表示你已检查该项，不代表条款当然合法；涉及放弃全部请求、竞业限制、股权或复杂争议时，应另行咨询专业律师。"
    )
    set_run_font(intro_run, size=9.8)

    add_meta_table(document)

    add_checklist_section(
        document,
        "一、文件与签署信息",
        [
            "协议写明双方主体、解除日期、版本和总页数。",
            "已取得完整协议及附件，不是单页文件或口头方案。",
            "空白处已填写或划掉，没有留下可后补的空白。",
            "签署页和附件齐全，签署后可保留盖章文本。",
        ],
    )

    add_checklist_section(
        document,
        "二、解除事实与程序",
        [
            "协议写清提出方、解除理由和依据。",
            "通知、签收、邮件和聊天记录能对应同一日期与理由。",
            "第 40 条情形：核对 30 日通知或代通知金。",
            "不能胜任、违纪或裁员：已索要考核、培训和程序材料。",
            "口头谈话已记录时间、地点、参与人和要点。",
        ],
    )

    add_checklist_section(
        document,
        "三、补偿金额与支付安排",
        [
            "写明工作起止日期、年限和 N 的取整方式。",
            "写明月工资基数及工资、奖金、补贴明细。",
            "说明是否触发三倍封顶和最高 12 年限制。",
            "分别列明 N、N+1、2N 或 0，未将 2N 与 +1 相加。",
            "写明税前或税后金额、扣款和实际到手金额。",
            "写明支付日期、方式和分期安排。",
        ],
        page_break_before=True,
    )

    add_checklist_section(
        document,
        "四、工资与其他应付款项",
        [
            "尾工资、绩效、奖金、提成和报销分别列明。",
            "年假、加班费、二倍工资等事项单独列出。",
            "年终奖、股权或期权等特殊项目已单独标记。",
            "“所有款项已结清”没有替代具体项目和金额。",
            "每笔款项都有工资条、流水或审批记录。",
        ],
    )

    add_checklist_section(
        document,
        "五、社保、档案和离职证明",
        [
            "写明社保缴至月份、停缴和配合手续。",
            "公积金、档案和居住证事项已核对。",
            "离职证明的内容、时间和交付方式已明确。",
            "工作交接、物品归还和所需材料有记录。",
        ],
        page_break_before=True,
    )

    add_checklist_section(
        document,
        "六、权利处分与限制性条款",
        [
            "一次性放弃全部请求的条款已单独标出。",
            "放弃仲裁、诉讼或投诉权利的条款已复核。",
            "保密和竞业限制的范围、期限、补偿已核对。",
            "违约金、赔偿责任和加重责任条款已核对。",
            "附件和承诺函没有超出主协议范围。",
        ],
    )

    add_checklist_section(
        document,
        "七、签署前最后确认",
        [
            "已记录自己的测算金额、公司金额和差额原因。",
            "不清楚的条款已书面提问并保留回复。",
            "未签空白协议，也未在无法保留副本时签字。",
            "已评估是否咨询律师或仲裁机构并备份材料。",
        ],
    )

    document.add_page_break()

    note = document.add_paragraph()
    note.paragraph_format.space_before = Pt(12)
    note.paragraph_format.space_after = Pt(4)
    note_run = note.add_run("高风险信号")
    set_run_font(note_run, size=12, bold=True, color=INK)

    for text in [
        "协议金额明显低于你根据工资、年限和解除情形做出的测算，但公司拒绝解释计算过程。",
        "协议要求你在没有拿到完整文本、计算明细或支付保障的情况下立即签字。",
        "协议把补偿、工资、加班费、年假和社保等不同请求打包成一个无法拆分的总额。",
        "协议要求放弃全部权利，却没有列出具体金额、支付时间和例外事项。",
    ]:
        paragraph = document.add_paragraph(style="List Bullet")
        paragraph.paragraph_format.space_after = Pt(2)
        run = paragraph.add_run(text)
        set_run_font(run, size=9.8)

    add_comparison_record(document)

    add_page_number_footer(document)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    document.save(OUTPUT)
    print(OUTPUT)


if __name__ == "__main__":
    build_document()
