namespace Worker.Exceptions;

public class CircuitOpenException : Exception
{
    public CircuitOpenException() { }
    public CircuitOpenException(string message) : base(message) { }
}
