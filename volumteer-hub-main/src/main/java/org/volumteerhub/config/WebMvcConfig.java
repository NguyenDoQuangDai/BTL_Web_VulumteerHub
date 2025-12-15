package org.volumteerhub.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final StorageProperties props;

    public WebMvcConfig(StorageProperties props) {
        this.props = props;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String filePrefix = "file:";

        // Serve 'public' folder at root URL "/"
        registry.addResourceHandler("/**")
                .addResourceLocations(filePrefix + props.getPublicPath().toUri().getPath() + "/");

        // Serve 'uploads' folder at "/uploads/**"
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(filePrefix + props.getUploadsPath().toUri().getPath() + "/");
    }
}