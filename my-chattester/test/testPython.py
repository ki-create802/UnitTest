
def test_complex_case(a: int, b: bool, c: str) -> str:
    if a > 10:
        if b:
            return "Case 1"
        else:
            if c == "yes":
                return "Case 2"
    elif a > 5:
        return "Case 3"
    return "Default"