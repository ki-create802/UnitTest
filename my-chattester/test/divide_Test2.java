import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.Test;

public class divide_test2_Test {

    @Test
    public void testDivideLargeNumbers() {
        double result = MathUtils.divide(1000000, 1000);
        assertEquals(1000.0, result, 0.0001);
    }

    @Test
    public void testDivideNegativeDenominator() {
        double result = MathUtils.divide(10, -2);
        assertEquals(-5.0, result, 0.0001);
    }

    @Test
    public void testDivideBothNegative() {
        double result = MathUtils.divide(-10, -2);
        assertEquals(5.0, result, 0.0001);
    }

    @Test
    public void testDivideOne() {
        double result = MathUtils.divide(10, 1);
        assertEquals(10.0, result, 0.0001);
    }

    @Test
    public void testDivideSameNumber() {
        double result = MathUtils.divide(10, 10);
        assertEquals(1.0, result, 0.0001);
    }
}