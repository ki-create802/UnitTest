import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;

public class divide_test1_Test {

    @Test
    public void testDivideNormalCase() {
        double result = MathUtils.divide(10, 2);
        assertEquals(5.0, result, 0.0001);
    }

    @Test
    public void testDivideFractionalResult() {
        double result = MathUtils.divide(5, 2);
        assertEquals(2.5, result, 0.0001);
    }

    @Test
    public void testDivideByZero() {
        assertThrows(ArithmeticException.class, () -> MathUtils.divide(10, 0));
    }

    @Test
    public void testDivideNegativeNumbers() {
        double result = MathUtils.divide(-10, 2);
        assertEquals(-5.0, result, 0.0001);
    }

    @Test
    public void testDivideZeroNumerator() {
        double result = MathUtils.divide(0, 5);
        assertEquals(0.0, result, 0.0001);
    }
}