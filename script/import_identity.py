"""Conservative identity review. Outputs locations/counts only, never merges."""
import re
import unicodedata
from decimal import Decimal, InvalidOperation

def digits(value):
    text = str(value or '').strip()
    if re.fullmatch(r'\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?', text):
        try:
            number = Decimal(text)
            if not number.is_finite() or number != number.to_integral_value():
                return ''
            text = format(number, 'f').split('.')[0]
        except InvalidOperation:
            return ''
    return re.sub(r'\D', '', text)

def valid_cpf(value):
    value = digits(value)
    # Lost leading zeros are not invented to obtain a match.
    if len(value) != 11 or len(set(value)) == 1:
        return ''
    for length in (9, 10):
        check = (sum(int(value[i]) * (length + 1 - i) for i in range(length)) * 10) % 11
        if (0 if check == 10 else check) != int(value[length]):
            return ''
    return value

def normalized_name(value):
    return ' '.join(''.join(c for c in unicodedata.normalize('NFKD', str(value or ''))
                           if not unicodedata.combining(c)).casefold().split())

def keys(record):
    email = str(record.get('email') or '').strip().casefold()
    phone = digits(record.get('phone'))
    if len(phone) in (12, 13) and phone.startswith('55'):
        phone = phone[2:]
    return {'cpf': valid_cpf(record.get('cpf')), 'email': email if re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email) else '',
            'phone': phone if len(phone) in (10, 11) else '', 'name': normalized_name(record.get('name'))}

def compare_clients(source, existing):
    database = [(str(r['id']), keys(r)) for r in existing]
    rows, source_keys = [], []
    for row in source:
        key = keys({'name':row.get('B'), 'phone':row.get('C'), 'cpf':row.get('D'), 'email':row.get('E')})
        evidence = {field: {id for id, other in database if key[field] and key[field] == other[field]}
                    for field in ('cpf', 'email', 'phone', 'name')}
        strong = evidence['cpf'] | evidence['email']
        if len(strong) > 1:
            status = 'conflicting_identity'
        elif strong:
            id = next(iter(strong))
            other = next(k for dbid, k in database if dbid == id)
            conflict = any(key[f] and other[f] and key[f] != other[f] for f in ('cpf','email','name'))
            status = 'conflicting_identity' if conflict else 'existing_candidate_review'
        elif evidence['phone'] or evidence['name']:
            status = 'weak_candidate_review'
        else:
            status = 'new_candidate'
        duplicate = [n for n, previous in source_keys if any(key[f] and key[f] == previous[f] for f in ('cpf','email'))]
        source_keys.append((row['row'], key))
        rows.append({'row':row['row'], 'status':status, 'evidence':[f for f, ids in evidence.items() if ids], 'source_duplicate_rows':duplicate})
    return {'mode':'review_only_no_merges', 'existing_count':len(existing),
            'counts':{s:sum(r['status'] == s for r in rows) for s in ('new_candidate','existing_candidate_review','weak_candidate_review','conflicting_identity')}, 'rows':rows}
