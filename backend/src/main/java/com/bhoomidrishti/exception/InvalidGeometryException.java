package com.bhoomidrishti.exception;

/** Thrown when a GeoJSON geometry cannot be parsed for a spatial query -> 400. */
public class InvalidGeometryException extends RuntimeException {

    public InvalidGeometryException(String message) {
        super(message);
    }
    
    public InvalidGeometryException(String message, Throwable cause) {
        super(message, cause);
    }
}
