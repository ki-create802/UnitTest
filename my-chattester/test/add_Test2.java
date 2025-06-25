import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

public class add_test2_Test {

    @Test
    public void testAddPositiveAndNegative() {
        int result = MathUtils.add(5, -3);
        assertEquals(2, result);
    }

    @Test
    public void testAddLargeNumbers() {
        int result = MathUtils.add(2147483647, 1);
        assertEquals(-2147483648, result); // Testing integer overflow
    }

    @Test
    public void testAddOneZero() {
        int result = MathUtils.add(5, 0);
        assertEquals(5, result);
    }
}