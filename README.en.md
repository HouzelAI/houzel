<p align="right">
    <a href="./README.md">Português</a> | <b>English</b>
</p>

# Houzel – Essay Correction with Interactive Chat

**Houzel** is a web application built with **Laravel + React** that provides a real-time essay correction experience through an interactive chat interface.
Its main goal is to make the process of practicing and evaluating written texts more dynamic, accessible, and intuitive.

This project is part of a **Computer Science undergraduate thesis (TCC)**, focusing on the exploration of modern technologies for **real-time web applications**.

---

## What is Houzel?

Traditional essay correction often happens in a static way: the student writes, submits, and waits for the evaluator’s feedback.
Houzel turns this workflow into a **continuous conversation**, where each version of the text is analyzed, and the student receives **instant feedback** through chat.

* **Real-time correction**: students submit their text and get instant feedback
* **User-friendly interface**: a modern chat inspired by popular messaging apps
* **Learning-focused**: structured feedback with grades and improvement suggestions
* **Saved history**: all interactions are stored, enabling progress tracking
* **Responsive environment**: fully adapted for both desktop and mobile

---

## Key Features

* **Tutor-like chat** for essay practice
* **Message persistence** with optional authentication
* **Detailed feedback** on clarity, cohesion, and argumentation
* **Modern design** with Tailwind CSS v4 and shadcn/ui
* **Light/Dark mode support**

---

## Tech Stack

* **Laravel 12** – backend, API, and flow management
* **React 19 + Inertia.js** – interactive frontend
* **Tailwind CSS v4** – modern and responsive styling
* **SQLite/MySQL/PostgreSQL** – supported databases

---

## Academic Context

This project was developed as part of a **Computer Science undergraduate thesis (TCC)** with the goal of exploring:

* **Real-time web applications**, using modern backend and frontend technologies
* **Interactive user experiences**, through conversational interfaces that simulate virtual tutors
* **Automated feedback integration in education**, expanding the role of digital tools in writing practice

While the core technical focus of the thesis lies in **compilers and language analysis**, Houzel represents the **user-facing layer**: a practical environment where students can **write, review, and improve essays** in a continuous and accessible way.

---

## Quick Start

1. Clone the repository and install dependencies:

```bash
composer install
npm install
```

2. Set up your environment:

```bash
cp .env.example .env
php artisan key:generate
```

3. Run migrations and start the development server:

```bash
php artisan migrate
composer dev
```

---

## Roadmap

* [x] Interactive feedback chat
* [x] User authentication
* [ ] Teacher dashboard to track multiple students
* [ ] Export performance reports
* [ ] Integration with external evaluation services

---

## License

Houzel is open-source software licensed under the [MIT License](LICENSE.md).