package com.example.demo.services;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.Map;

/**
 * HTTP-клиент для Telegram Bot API.
 *
 * Инжектирует RestTemplate через RestTemplateBuilder (с таймаутами и connection
 * pool),
 * а не создаёт new RestTemplate() — что даёт управление конфигурацией и
 * testability.
 */
@Slf4j
@Component
public class TelegramBotClient {

    private final RestTemplate restTemplate;

    @Value("${telegram.bot.enabled:false}")
    private boolean botEnabled;

    @Value("${telegram.bot.token:}")
    private String botToken;

    @Value("${telegram.bot.api-base:https://api.telegram.org}")
    private String apiBase;

    public TelegramBotClient(RestTemplateBuilder builder) {
        this.restTemplate = builder
                .setConnectTimeout(Duration.ofSeconds(5))
                .setReadTimeout(Duration.ofSeconds(10))
                .build();
    }

    public boolean isConfigured() {
        return botEnabled && botToken != null && !botToken.isBlank();
    }

    /**
     * Отправляет сообщение пользователю в Telegram.
     *
     * @param chatId числовой ID чата Telegram
     * @param text   текст сообщения (поддерживает Markdown)
     * @return true если успешно
     */
    public boolean sendMessage(String chatId, String text) {
        if (!isConfigured()) {
            log.debug("Telegram bot not configured — sendMessage skipped");
            return false;
        }
        if (chatId == null || chatId.isBlank() || text == null || text.isBlank()) {
            log.warn("sendMessage called with blank chatId or text");
            return false;
        }

        try {
            String url = String.format("%s/bot%s/sendMessage", apiBase, botToken);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> payload = Map.of(
                    "chat_id", chatId,
                    "text", text,
                    "parse_mode", "Markdown",
                    "disable_web_page_preview", true);

            var resp = restTemplate.postForEntity(url, new HttpEntity<>(payload, headers), String.class);
            log.info("Telegram sendMessage OK → chatId=***{} status={}",
                    safeSuffix(chatId), resp.getStatusCode());
            return true;

        } catch (org.springframework.web.client.HttpClientErrorException ex) {
            log.error("Telegram sendMessage FAILED → chatId=***{} httpStatus={} body={}",
                    safeSuffix(chatId), ex.getStatusCode(), ex.getResponseBodyAsString());
            return false;
        } catch (Exception ex) {
            log.error("Telegram sendMessage ERROR → chatId=***{} error={}",
                    safeSuffix(chatId), ex.getMessage());
            return false;
        }
    }

    /** Возвращает последние 4 символа строки для безопасного логирования */
    private String safeSuffix(String value) {
        if (value == null || value.length() < 4)
            return "????";
        return value.substring(value.length() - 4);
    }
}
