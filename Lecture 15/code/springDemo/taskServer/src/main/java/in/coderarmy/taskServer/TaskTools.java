package in.coderarmy.taskServer;

import org.springframework.ai.mcp.annotation.McpTool;
import org.springframework.ai.mcp.annotation.McpToolParam;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class TaskTools {

    private final List<String> tasks = new ArrayList<>();


    @McpTool(
            name = "create_task",
            description = "Create a new task"
    )
    public String createTask(
            @McpToolParam(
                    description = "Title of the task",
                    required = true
            )
            String title
    ) {

        tasks.add(title);

        return "Task created: " + title;
    }


    @McpTool(
            name = "list_tasks",
            description = "List all pending tasks"
    )
    public List<String> listTasks() {

        return List.copyOf(tasks);
    }


    @McpTool(
            name = "complete_task",
            description = "Complete a task using its exact title"
    )
    public String completeTask(
            @McpToolParam(
                    description = "Exact title of the task",
                    required = true
            )
            String title
    ) {

        boolean removed = tasks.remove(title);

        if (removed) {
            return "Task completed: " + title;
        }

        return "Task not found: " + title;
    }
}
