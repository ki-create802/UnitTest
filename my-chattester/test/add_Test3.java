import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

public class MathUtils_test3_Test {

    @Test
    public void testAddMinInt() {
        int result = MathUtils.add(Integer.MIN_VALUE, 0);
        assertEquals(Integer.MIN_VALUE, result);
    }

    @Test
    public void testAddOneNegativeOnePositive() {
        int result = MathUtils.add(-10, 15);
        assertEquals(5, result);
    }

    @Test
    public void testAddCommutativeProperty() {
        int result1 = MathUtils.add(3, 5);
        int result2 = MathUtils.add(5, 3);
        assertEquals(result1, result2);
    }
}