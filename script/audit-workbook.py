"""Read-only XLSX inventory. Emits counts/headers, never personal row values."""
import sys, json, zipfile, posixpath
import xml.etree.ElementTree as ET
N = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(sys.argv[1]) as z:
    root = ET.fromstring(z.read('xl/workbook.xml'))
    rels = {r.attrib['Id']: r.attrib['Target'] for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
    strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        strings = [''.join(s.itertext()) for s in ET.fromstring(z.read('xl/sharedStrings.xml'))]
    def value(c):
        v = c.find('m:v', N)
        if c.attrib.get('t') == 's' and v is not None:
            return strings[int(v.text)]
        if c.attrib.get('t') == 'inlineStr':
            return ''.join(c.find('m:is', N).itertext())
        return v.text if v is not None else None
    for s in root.find('m:sheets', N):
        target = rels[s.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
        path = target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/' + target)
        rows = ET.fromstring(z.read(path)).findall('m:sheetData/m:row', N)
        literal_rows = []
        errors = 0
        headers = []
        for row in rows:
            cells = list(row)
            literal = [c for c in cells if c.find('m:f', N) is None and value(c) not in (None, '')]
            if literal:
                literal_rows.append(int(row.attrib['r']))
            errors += sum(c.attrib.get('t') == 'e' for c in cells)
            if int(row.attrib['r']) <= 3:
                text = [value(c) for c in literal if c.attrib.get('t') in ('s', 'inlineStr')]
                if len(text) > len(headers): headers = text
        names = {'CLIENTES': ('B', 1), 'PETS': ('D', 1), 'PACOTES': ('B', 1), 'FINANCEIROPACOTES': ('C', 1), 'AGENDA': ('A', 2)}
        records = None
        if s.attrib['name'] in names:
            col, header_row = names[s.attrib['name']]
            records = sum(any(c.attrib['r'] == col + row.attrib['r'] and value(c) not in (None, '', '0') for c in row) for row in rows if int(row.attrib['r']) > header_row)
        print(json.dumps({'sheet':s.attrib['name'],'physical_rows':len(rows),'rows_with_literal_input':len(literal_rows),'candidate_records_by_required_column':records,'cached_error_cells':errors,'headers':headers}, ensure_ascii=False))
