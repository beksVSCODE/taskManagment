package com.example.demo.services;

import com.example.demo.entity.Task;
import com.example.demo.entity.User;
import com.example.demo.enums.NotificationTypes;
import com.example.demo.enums.Priority;
import com.example.demo.enums.TaskStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramNotificationService {

    private final TelegramBotClient telegramBotClient;

    @Value("${telegram.notifications.frontend-base-url:http://localhost:3000}")
    private String frontendBaseUrl;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd.MM.yyyy");

    @Async
    public void send(User user, String type, String message, Task task) {
        if (user == null)
            return;
        if (!user.isTelegramNotificationsEnabled()) {
            log.debug("Telegram skip: notifications disabled for userId={}", user.getId());
            return;
        }
        if (user.getTelegramChatId() == null || user.getTelegramChatId().isBlank()) {
            log.debug("Telegram skip: no chatId for userId={}", user.getId());
            return;
        }
        if (!telegramBotClient.isConfigured()) {
            log.warn("Telegram bot not configured (token/enabled missing)");
            return;
        }
        log.info("Sending Telegram notification type={} to userId={} chatId=***{}",
                type, user.getId(),
                user.getTelegramChatId().length() >= 4
                        ? user.getTelegramChatId().substring(user.getTelegramChatId().length() - 4)
                        : user.getTelegramChatId());
        String telegramText = buildText(type, message, task, user);
        boolean ok = telegramBotClient.sendMessage(user.getTelegramChatId(), telegramText);
        if (!ok) {
            log.warn("Telegram notification FAILED for userId={} type={}", user.getId(), type);
        }
    }

    private String buildText(String type, String message, Task task, User recipient) {
        StringBuilder sb = new StringBuilder();
        NotificationMeta meta = metaFor(type);

        sb.append(meta.icon()).append(" *").append(meta.title()).append("*\n");
        sb.append(
                "\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n");

        String firstName = recipient != null && recipient.getFullName() != null
                ? recipient.getFullName().split(" ")[0]
                : null;
        if (firstName != null && !firstName.isBlank()) {
            sb.append("\u041f\u0440\u0438\u0432\u0435\u0442, ").append(esc(firstName)).append("! \ud83d\udc4b\n\n");
        }
        if (message != null && !message.isBlank()) {
            sb.append(esc(message)).append("\n");
        }
        if (task != null && task.getId() != null) {
            sb.append("\n");
            sb.append("\ud83d\udccb *\u0417\u0430\u0434\u0430\u0447\u0430:* ").append(esc(task.getTitle()))
                    .append("\n");
            if (task.getProject() != null && task.getProject().getName() != null) {
                sb.append("\ud83d\udcc1 *\u041f\u0440\u043e\u0435\u043a\u0442:* ")
                        .append(esc(task.getProject().getName())).append("\n");
            }
            if (task.getStatus() != null) {
                sb.append("\ud83d\udd16 *\u0421\u0442\u0430\u0442\u0443\u0441:* ").append(statusLabel(task.getStatus()))
                        .append("\n");
            }
            if (task.getPriority() != null) {
                sb.append("\u26a1 *\u041f\u0440\u0438\u043e\u0440\u0438\u0442\u0435\u0442:* ")
                        .append(priorityLabel(task.getPriority())).append("\n");
            }
            if (task.getDueDate() != null) {
                boolean overdue = task.getDueDate().isBefore(LocalDate.now());
                String dueDateStr = task.getDueDate().format(DATE_FMT);
                sb.append(overdue ? "\ud83d\udd34" : "\ud83d\udcc5")
                        .append(" *\u0414\u0435\u0434\u043b\u0430\u0439\u043d:* ").append(dueDateStr);
                if (overdue)
                    sb.append(" _(\u043f\u0440\u043e\u0441\u0440\u043e\u0447\u0435\u043d\u043e)_");
                sb.append("\n");
            }
            if (frontendBaseUrl != null && !frontendBaseUrl.isBlank()) {
                String projectId = task.getProject() != null && task.getProject().getId() != null
                        ? String.valueOf(task.getProject().getId())
                        : "";
                String link = frontendBaseUrl + "/project/" + projectId + "?taskId=" + task.getId();
                sb.append("\n\ud83d\udd17 ").append(link);
            }
        }
        sb.append(
                "\n\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501");
        return sb.toString();
    }

    // NotificationMeta: combines icon + title to avoid duplicating a switch
    private record NotificationMeta(String icon, String title) {
    }

    private NotificationMeta metaFor(String type) {
        if (type == null)
            return new NotificationMeta("\ud83d\udd14",
                    "\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u0435");
        return switch (type) {
            case NotificationTypes.TASK_ASSIGNED -> new NotificationMeta("\ud83d\udccc",
                    "\u0412\u0430\u043c \u043d\u0430\u0437\u043d\u0430\u0447\u0435\u043d\u0430 \u0437\u0430\u0434\u0430\u0447\u0430");
            case NotificationTypes.STATUS_CHANGED -> new NotificationMeta("\ud83d\udd04",
                    "\u0421\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u0434\u0430\u0447\u0438 \u0438\u0437\u043c\u0435\u043d\u0451\u043d");
            case NotificationTypes.NEW_COMMENT -> new NotificationMeta("\ud83d\udcac",
                    "\u041d\u043e\u0432\u044b\u0439 \u043a\u043e\u043c\u043c\u0435\u043d\u0442\u0430\u0440\u0438\u0439");
            case NotificationTypes.MENTION -> new NotificationMeta("\ud83d\udce3",
                    "\u0412\u0430\u0441 \u0443\u043f\u043e\u043c\u044f\u043d\u0443\u043b\u0438");
            case NotificationTypes.TASK_OVERDUE -> new NotificationMeta("\ud83d\udea8",
                    "\u0417\u0430\u0434\u0430\u0447\u0430 \u043f\u0440\u043e\u0441\u0440\u043e\u0447\u0435\u043d\u0430");
            default -> new NotificationMeta("\ud83d\udd14",
                    "\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u0435");
        };
    }

    /**
     * Escapes Telegram legacy Markdown special chars: * _ ` [
     * Apply to all user-supplied content (task title, project name, message).
     */
    private static String esc(String text) {
        if (text == null)
            return "\u2014";
        return text
                .replace("_", "\\_")
                .replace("*", "\\*")
                .replace("`", "\\`")
                .replace("[", "\\[");
    }

    private String statusLabel(TaskStatus status) {
        return switch (status) {
            case NEW -> "\ud83c\udd95 \u041d\u043e\u0432\u0430\u044f";
            case IN_PROGRESS -> "\u2699\ufe0f \u0412 \u0440\u0430\u0431\u043e\u0442\u0435";
            case REVIEW -> "\ud83d\udc40 \u041d\u0430 \u043f\u0440\u043e\u0432\u0435\u0440\u043a\u0435";
            case DONE -> "\u2705 \u0412\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u0430";
        };
    }

    private String priorityLabel(Priority priority) {
        return switch (priority) {
            case LOW -> "\ud83d\udfe2 \u041d\u0438\u0437\u043a\u0438\u0439";
            case MEDIUM -> "\ud83d\udfe1 \u0421\u0440\u0435\u0434\u043d\u0438\u0439";
            case HIGH -> "\ud83d\udfe0 \u0412\u044b\u0441\u043e\u043a\u0438\u0439";
            case URGENT -> "\ud83d\udd34 \u0421\u0440\u043e\u0447\u043d\u043e";
        };
    }
}
