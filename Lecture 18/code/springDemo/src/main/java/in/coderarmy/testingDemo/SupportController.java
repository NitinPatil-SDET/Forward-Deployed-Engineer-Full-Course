package in.coderarmy.testingDemo;

import in.coderarmy.testingDemo.models.AgentResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;


@RestController
public class SupportController {

    private final SupportService supportService;

    public SupportController(SupportService supportService) {
        this.supportService = supportService;
    }

    @PostMapping("/chat")
    public AgentResponse chat(@RequestParam String message) {
        return supportService.chat(message);
    }
}
