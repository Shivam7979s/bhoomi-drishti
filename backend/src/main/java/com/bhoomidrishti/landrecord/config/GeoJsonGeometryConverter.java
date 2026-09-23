package com.bhoomidrishti.landrecord.config;

import com.bhoomidrishti.exception.InvalidGeometryException;
import java.io.StringReader;
import org.locationtech.jts.geom.Geometry;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.locationtech.jts.io.ParseException;
import org.locationtech.jts.io.geojson.GeoJsonReader;
import org.locationtech.jts.io.geojson.GeoJsonWriter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.core.JacksonException;
import tools.jackson.core.JsonGenerator;
import tools.jackson.core.JsonParser;
import tools.jackson.databind.DeserializationContext;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.SerializationContext;
import tools.jackson.databind.ValueDeserializer;
import tools.jackson.databind.ValueSerializer;
import tools.jackson.databind.module.SimpleModule;

/**
 * (De)serializes JTS {@link Geometry} to/from GeoJSON, enforcing SRID 4326 on read.
 *
 * <p>Exposes a Jackson {@link SimpleModule} bean so Spring Boot's {@code ObjectMapper}
 * auto-registers it. On deserialization a malformed or non-SRID-4326 geometry raises
 * {@link InvalidGeometryException}, which the global handler maps to {@code 400}.
 */
@Configuration
public class GeoJsonGeometryConverter {

    private static final int SRID_4326 = 4326;

    @Bean
    public SimpleModule jtsGeoJsonModule() {
        SimpleModule module = new SimpleModule("JtsGeoJsonModule");
        module.addSerializer(Geometry.class, new Serializer());
        module.addDeserializer(Geometry.class, new Deserializer());
        return module;
    }

    public static class Deserializer extends ValueDeserializer<Geometry> {

        @Override
        public Geometry deserialize(JsonParser p, DeserializationContext ctxt) throws JacksonException {
            JsonNode node = p.readValueAsTree();
            if (node == null || node.isNull()) {
                return null;
            }
            String json = node.toString();
            GeometryFactory factory = new GeometryFactory(new PrecisionModel(), SRID_4326);
            GeoJsonReader reader = new GeoJsonReader(factory);
            try {
                Geometry geom = reader.read(new StringReader(json));
                if (geom == null) {
                    throw new InvalidGeometryException("Could not parse geometry from GeoJSON");
                }
                // Force the expected SRID — a geometry without crs is assumed WGS84.
                geom.setSRID(SRID_4326);
                return geom;
            } catch (ParseException e) {
                throw new InvalidGeometryException("Malformed GeoJSON geometry: " + e.getMessage(), e);
            }
        }
    }

    public static class Serializer extends ValueSerializer<Geometry> {

        @Override
        public void serialize(Geometry value, JsonGenerator gen, SerializationContext ctxt) throws JacksonException {
            if (value == null) {
                gen.writeNull();
                return;
            }
            GeoJsonWriter writer = new GeoJsonWriter();
            String geoJson = writer.write(value);
            gen.writeRawValue(geoJson);
        }
    }
}