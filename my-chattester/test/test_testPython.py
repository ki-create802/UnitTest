from testPython import test_complex_case

import unittest

class TestComplexCase(unittest.TestCase):
    def test_case1(self):
        result = test_complex_case(11, True, "no")
        self.assertEqual(result, "Case 1")

    def test_case2(self):
        result = test_complex_case(11, False, "yes")
        self.assertEqual(result, "Case 2")

    def test_case3(self):
        result = test_complex_case(11, False, "no")
        self.assertEqual(result, "Default")

    def test_case4(self):
        result = test_complex_case(6, False, "no")
        self.assertEqual(result, "Case 3")

    def test_case5(self):
        result = test_complex_case(4, False, "no")
        self.assertEqual(result, "Default")

if __name__ == '__main__':
    unittest.main()