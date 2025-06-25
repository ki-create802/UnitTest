import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

public class abs_test1_Test {

    @Test
    public void testAbsPositiveNumber() {
        int result = MathUtils.abs(5);
        assertEquals(5, result);
    }

    @Test
    public void testAbsNegativeNumber() {
        int result = MathUtils.abs(-5);
        assertEquals(5, result);
    }

    @Test
    public void testAbsZero() {
        int result = MathUtils.abs(0);
        assertEquals(0, result);
    }
}