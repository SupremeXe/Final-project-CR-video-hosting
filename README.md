# Видеохостинг CR

Учебный проект видеохостинга на PHP + MySQL + JavaScript (fetch, FormData).
Функции: регистрация/авторизация, загрузка видео с прогрессом, просмотр, лайки, поиск и сортировка.

## Функции

- Регистрация и вход (email + пароль)
- Загрузка видео (title + video файл)
- Отображение списка видео карточками
- Воспроизведение видео
- Лайки (интерактивно)
- Поиск по названию
- Сортировка по дате, названию, лайкам

## Стек

- PHP 8.x (XAMPP)
- MySQL / MariaDB (phpMyAdmin)
- HTML/CSS (БЭМ), JavaScript

## Запуск проекта (локально)

1. Запустите XAMPP: Apache + MySQL.
2. Скопируйте папку проекта в:
   `C:\xampp\htdocs\video-hosting`
3. Создайте базу и таблицы:
   - phpMyAdmin → Import → `backend/db/schema.sql`
4. Откройте сайт:
   - Frontend: `http://localhost/video-hosting/frontend/index.html`

## База данных

- `backend/db/schema.sql` — схема
- `backend/db/backup.sql` — экспорт базы (после тестирования)

## Загрузка файлов

Видео сохраняются в папку:

- `/videos/`

## Скриншоты

Скриншоты интерфейса лежат в папке:

- `/screenshots/`
