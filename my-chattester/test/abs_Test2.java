import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

public class abs_test2_Test {

    @Test
    public void testAbsLargePositiveNumber() {
        int result = MathUtils.abs(Integer.MAX_VALUE);
        assertEquals(Integer.MAX_VALUE, result);
    }

    @Test
    public void testAbsLargeNegativeNumber() {
        int result = MathUtils.abs(Integer.MIN_VALUE + 1);
        assertEquals(Integer.MAX_VALUE, result);
    }

    @Test
    public void testAbsEdgeCase() {
        int result = MathUtils.abs(-1);
        assertEquals(1, result);
    }
}