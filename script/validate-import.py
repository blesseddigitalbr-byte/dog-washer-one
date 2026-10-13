"""Read-only import checks. Reports row locations/counts, never personal values."""
import sys, json, zipfile, posixpath, hashlib, re
from collections import Counter
import xml.etree.ElementTree as ET
N = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def validate(path):
    with open(path, 'rb') as f: digest = hashlib.file_digest(f, 'sha256').hexdigest() if hasattr(hashlib, 'file_digest') else hashlib.sha256(f.read()).hexdigest()
    sheets = {}
    with zipfile.ZipFile(path) as z:
        strings = [''.join(x.itertext()) for x in ET.fromstring(z.read('xl/sharedStrings.xml'))] if 'xl/sharedStrings.xml' in z.namelist() else []
        rels = {r.attrib['Id']: r.attrib['Target'] for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        for s in ET.fromstring(z.read('xl/workbook.xml')).find('m:sheets', N):
            if s.attrib['name'] not in ['CLIENTES', 'PETS', 'PACOTES', 'FINANCEIROPACOTES']: continue
            t = rels[s.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
            p = t.lstrip('/') if t.startswith('/') else posixpath.normpath('xl/'+t)
            rows = []
            for row in ET.fromstring(z.read(p)).findall('m:sheetData/m:row', N):
                result = {'row': int(row.attrib['r'])}
                for c in row:
                    v = c.find('m:v', N)
                    text = v.text if v is not None else ''
                    if c.attrib.get('t') == 's' and text: text = strings[int(text)]
                    if c.attrib.get('t') == 'inlineStr': text = ''.join(c.find('m:is', N).itertext())
                    result[re.sub(r'\d', '', c.attrib['r'])] = (text or '').strip()
                rows.append(result)
            key = 'D' if s.attrib['name'] == 'PETS' else 'C' if s.attrib['name'] == 'FINANCEIROPACOTES' else 'B'
            sheets[s.attrib['name']] = [r for r in rows if r['row'] > 1 and r.get(key) not in (None, '', '0')]
    issues = []
    def issue(sheet, row, code): issues.append({'sheet':sheet,'row':row,'code':code})
    for name in ['CLIENTES','PETS','PACOTES']:
        records = sheets.get(name, [])
        counts = Counter(r.get('A', '') for r in records)
        for r in records:
            if not r.get('A'): issue(name,r['row'],'missing_source_id')
            elif counts[r['A']] > 1: issue(name,r['row'],'duplicate_source_id')
    clients = {r.get('A') for r in sheets.get('CLIENTES', [])}
    pets = {r.get('A'): r for r in sheets.get('PETS', [])}
    packages = {r.get('A') for r in sheets.get('PACOTES', [])}
    for r in sheets.get('PETS', []):
        if r.get('C') not in clients: issue('PETS',r['row'],'unknown_client_id')
    for r in sheets.get('PACOTES', []):
        if r.get('D') not in clients: issue('PACOTES',r['row'],'unknown_client_id')
        if r.get('C') not in pets: issue('PACOTES',r['row'],'unknown_pet_id')
        elif pets[r['C']].get('C') != r.get('D'): issue('PACOTES',r['row'],'pet_client_mismatch')
        for col in ['G','H','I','J','K','L']:
            try:
                number = float(r.get(col, ''))
                if number < 0: issue('PACOTES',r['row'],'negative_quantity_'+col)
            except ValueError: issue('PACOTES',r['row'],'missing_or_invalid_quantity_'+col)
    for r in sheets.get('FINANCEIROPACOTES', []):
        if r.get('D') and r['D'] not in packages: issue('FINANCEIROPACOTES',r['row'],'unknown_package_id')
    return {'source_sha256':digest,'mode':'preview_only','candidate_counts':{k:len(v) for k,v in sheets.items()},'issues':issues,'limitations':['No database duplicate comparison yet','Cached formula values are not recalculation proof','Dates, CPF, agenda history and financial amounts require further checks','No database or external writes performed']}
if __name__ == '__main__':
    print(json.dumps(validate(sys.argv[1]), ensure_ascii=True))
