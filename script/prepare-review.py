"""Private staging payload on stdout. Never redirect this output to a Git file.

No operational imports, database writes, messages or financial effects.
Source file is read only; originals remain separate from future adjustments.
"""
import importlib.util
import json
import pathlib
import sys

def prepare(path):
    module_path = pathlib.Path(__file__).with_name('validate-import.py')
    spec = importlib.util.spec_from_file_location('validator', module_path)
    validator = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(validator)
    checked = validator.validate(path, include_private_rows=True)
    issues = {}
    for issue in checked['issues']:
        issues.setdefault((issue['sheet'], issue['row']), []).append(issue['code'])
    rows = []
    for sheet, records in checked['private_source_rows'].items():
        for record in records:
            rows.append({'source_sha256': checked['source_sha256'], 'source_sheet':sheet,
                         'source_row': record['row'],
                         'original_values':{k:v for k,v in record.items() if k != 'row'},
                         'issues':['Origem ainda não aprovada para importação definitiva', *issues.get((sheet,record['row']),[])]})
    return {'source_sha256':checked['source_sha256'], 'counts':checked['candidate_counts'], 'rows':rows}

if __name__ == '__main__':
    if '--private-stdout' not in sys.argv:
        raise SystemExit('Requires --private-stdout; output contains personal data, not suitable for logs or Git.')
    print(json.dumps(prepare(sys.argv[1]),ensure_ascii=True))
