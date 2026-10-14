import unittest
from import_identity import compare_clients, digits, valid_cpf

class IdentityTests(unittest.TestCase):
    def row(self, n=2, **values):
        return {'row':n, 'B':'Pessoa Teste', **values}
    def test_numeric_phone(self):
        self.assertEqual(digits('6.199988548e10'), '61999885480')
        self.assertEqual(digits('1.5'), '')
    def test_invalid_cpf_not_match(self):
        self.assertEqual(valid_cpf('111.111.111-11'), '')
        self.assertEqual(valid_cpf('123'), '')
    def test_email_candidate_no_merge(self):
        result = compare_clients([self.row(E=' TEST@example.invalid ')], [{'id':'1', 'name':'Pessoa Teste', 'email':'test@example.invalid'}])
        self.assertEqual(result['rows'][0]['status'], 'existing_candidate_review')
        self.assertNotIn('id', result['rows'][0])
    def test_shared_phone_weak_only(self):
        result = compare_clients([self.row(C='61999999999')], [{'id':'1','phone':'5561999999999'}])
        self.assertEqual(result['rows'][0]['status'], 'weak_candidate_review')
    def test_conflicting_names(self):
        result = compare_clients([self.row(E='a@example.invalid')], [{'id':'1','name':'Outra Pessoa','email':'a@example.invalid'}])
        self.assertEqual(result['rows'][0]['status'], 'conflicting_identity')
    def test_conflicting_ids(self):
        result = compare_clients([self.row(E='a@example.invalid')], [{'id':'1','email':'a@example.invalid'}, {'id':'2','email':'a@example.invalid'}])
        self.assertEqual(result['rows'][0]['status'], 'conflicting_identity')
    def test_empty_not_match_and_source_duplicates(self):
        self.assertEqual(compare_clients([self.row()], [{'id':'1'}])['rows'][0]['status'], 'new_candidate')
        result = compare_clients([self.row(E='a@example.invalid'), self.row(3,E='a@example.invalid')], [])
        self.assertEqual(result['rows'][1]['source_duplicate_rows'], [2])

if __name__ == '__main__': unittest.main()
