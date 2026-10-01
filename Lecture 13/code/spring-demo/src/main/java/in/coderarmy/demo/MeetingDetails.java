package in.coderarmy.demo;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.stereotype.Service;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class MeetingDetails {
    private String title;
    private String attendee;
    private String date;
    private String time;
    private Integer durationMinutes;
}
