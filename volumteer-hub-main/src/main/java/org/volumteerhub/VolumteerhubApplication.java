package org.volumteerhub;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class VolumteerhubApplication {

    public static void main(String[] args) {
        SpringApplication.run(VolumteerhubApplication.class, args);
    }

}
