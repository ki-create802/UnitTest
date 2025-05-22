import unittest

class TestComplexCase(unittest.TestCase):
    def test_case1_a_gt_10_and_b_true(self):
        result = test_complex_case(11, True, 'no')
        self.assertEqual(result, 'Case 1')

    def test_case2_a_gt_10_and_b_false_c_yes(self):
        result = test_complex_case(12, False, 'yes')
        self.assertEqual(result, 'Case 2')

    def test_case3_a_gt_10_and_b_false_c_not_yes(self):
        result = test_complex_case(15, False, 'no')
        self.assertEqual(result, 'Default')

    def test_case4_a_gt_5_and_le_10(self):
        result = test_complex_case(8, False, 'no')
        self.assertEqual(result, 'Case 3')

    def test_case5_a_le_5(self):
        result = test_complex_case(4, True, 'yes')
        self.assertEqual(result, 'Default')

if __name__ == '__main__':
    unittest.main()