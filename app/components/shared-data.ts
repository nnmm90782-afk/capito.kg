import { Wifi, Car, Baby, Briefcase, Sun, Coffee, Utensils } from "lucide-react";

export const NAV_LINKS = [
  { label: "Главная",  href: "/" },
  { label: "Меню",     href: "/menu" },
  { label: "О нас",    href: "/about" },
  { label: "Филиалы",  href: "/branches" },
  { label: "Контакты", href: "/contacts" },
];

export const POPULAR_DRINKS = [
  { name: "Капучино",  description: "Мягкая молочная пена и крепкое эспрессо.", price: 220, accent: "#f5a623" },
  { name: "Латте",     description: "Мягкий вкус и бархатная текстура.",        price: 240, accent: "#ffc84a" },
  { name: "Раф кофе",  description: "Классика в новой интерпретации.",           price: 260, accent: "#f5a623" },
  { name: "Эспрессо",  description: "Чистый вкус и максимум энергии.",           price: 180, accent: "#ffc84a" },
  { name: "Флэт Уайт", description: "Насыщенный вкус с нежной текстурой.",      price: 230, accent: "#f5a623" },
  { name: "Матча Латте", description: "Японский чай с молоком и пеной.",         price: 270, accent: "#ffc84a" },
  { name: "Холодный кофе", description: "Освежающий напиток со льдом.",          price: 250, accent: "#f5a623" },
  { name: "Карамельный макиато", description: "Ваниль, карамель, эспрессо.",     price: 280, accent: "#ffc84a" },
];

export const ALL_BRANCHES = [
  { name: "Байтик Баатыра, 1/4", district: "Центр",              description: "Флагманский ресторан. 500+ мест, открытая кухня, пицца, bakery.", is24: false, phone: "+996 312 000 001", hours: "08:00 — 00:00", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&q=80" },
  { name: "Чуй, 92",             district: "Центр",              description: "Единственный круглосуточный филиал в центре города.",              is24: true,  phone: "+996 312 000 002", hours: "Круглосуточно",  image: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=600&q=80" },
  { name: "Киевская, 148",        district: "Центр",              description: "Уютный филиал на Левом берегу с большими окнами.",                is24: false, phone: "+996 312 000 003", hours: "08:00 — 23:00", image: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=600&q=80" },
  { name: "Абдумомунова, 221",    district: "Центр",              description: "Просторный зал, быстрое обслуживание.",                           is24: false, phone: "+996 312 000 004", hours: "08:00 — 23:00", image: "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=600&q=80" },
  { name: "Фрунзе, 282а",         district: "Центр",              description: "Уютный филиал с летней верандой.",                                is24: false, phone: "+996 312 000 005", hours: "08:00 — 23:00", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80" },
  { name: "Исанова, 41",          district: "Центр",              description: "Тихое место у делового центра.",                                  is24: false, phone: "+996 312 000 006", hours: "08:00 — 22:00", image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80" },
  { name: "Боконбаева, 103",      district: "Центр",              description: "Рядом с университетами и офисами.",                               is24: false, phone: "+996 312 000 007", hours: "08:00 — 22:00", image: "https://images.unsplash.com/photo-1464983953574-0892a716854b?w=600&q=80" },
  { name: "Айтматова, 3",         district: "Манаса / Айтматова", description: "Просторный зал у парка.",                                         is24: false, phone: "+996 312 000 008", hours: "08:00 — 23:00", image: "https://images.unsplash.com/photo-1519985176271-adb1088fa94c?w=600&q=80" },
  { name: "Манаса, 49",           district: "Манаса / Айтматова", description: "Быстрый сервис для деловых людей.",                               is24: false, phone: "+996 312 000 009", hours: "08:00 — 22:00", image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80" },
  { name: "Турусбекова, 100",     district: "Манаса / Айтматова", description: "Панорамные окна и живая музыка по выходным.",                     is24: false, phone: "+996 312 000 010", hours: "09:00 — 23:00", image: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=600&q=80" },
  { name: "Горького, 1/2",        district: "Другие районы",      description: "Филиал в историческом центре города.",                            is24: false, phone: "+996 312 000 011", hours: "08:00 — 22:00", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80" },
  { name: "Токомбаева, 23/9",     district: "Другие районы",      description: "Современный зал с рабочей зоной.",                               is24: false, phone: "+996 312 000 012", hours: "08:00 — 22:00", image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=600&q=80" },
  { name: "Тыналиева, 1/3",       district: "Другие районы",      description: "Семейная атмосфера и детская зона.",                             is24: false, phone: "+996 312 000 013", hours: "09:00 — 22:00", image: "https://images.unsplash.com/photo-1542181961-9590d0c79dab?w=600&q=80" },
];

export const STATS = [
  { value: "13",   label: "Филиалов" },
  { value: "2018", label: "Год основания" },
  { value: "100%", label: "Арабика" },
];

export const FEATURES = [
  { icon: Wifi,      label: "Wi-Fi"        },
  { icon: Car,       label: "Парковка"     },
  { icon: Baby,      label: "Детская зона" },
  { icon: Briefcase, label: "Рабочая зона" },
  { icon: Sun,       label: "Терраса"      },
];

export const REVIEWS = [
  { name: "Айгуль М.", rating: 5, text: "Лучший кофе в Бишкеке! Атмосфера великолепная, персонал всегда доброжелателен. Приходим сюда каждые выходные." },
  { name: "Руслан К.", rating: 5, text: "Раф кофе — просто шедевр. Интерьер очень стильный, приятно работать за ноутбуком. Быстрая доставка тоже радует." },
  { name: "Диана Т.",  rating: 5, text: "Наконец кофейня с достойным уровнем сервиса. Круассаны свежие каждое утро, капучино идеальный. Рекомендую всем!" },
];

export const CATEGORIES = [
  { icon: Coffee,   label: "Кофе",             slug: "coffee"    },
  { icon: Coffee,   label: "Авторские напитки", slug: "signature" },
  { icon: Coffee,   label: "Холодные напитки",  slug: "cold"      },
  { icon: Coffee,   label: "Чай",               slug: "tea"       },
  { icon: Utensils, label: "Bakery",             slug: "bakery"    },
  { icon: Utensils, label: "Пицца",              slug: "pizza"     },
  { icon: Utensils, label: "Паста",              slug: "pasta"     },
  { icon: Utensils, label: "Завтраки",           slug: "breakfast" },
];
