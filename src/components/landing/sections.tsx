import { Badge } from "@/components/ui/badge"

export const sections = [
  {
    id: 'hero',
    subtitle: <Badge variant="outline" className="text-[#8B0000] border-[#8B0000] bg-black/60 text-sm tracking-widest uppercase">Тьма ждёт тебя</Badge>,
    title: "Здесь живут страхи.",
    showButton: true,
    buttonText: 'Войти во тьму'
  },
  {
    id: 'about',
    title: 'Место, где страх реален.',
    content: 'ShadowTales — платформа для любителей хоррора. Читай истории, от которых стынет кровь, или поделись своей — если осмелишься.'
  },
  {
    id: 'features',
    title: 'Что тебя ждёт?',
    content: 'Сотни историй в жанре хоррор, мистики и триллера. Рейтинги, жуткие подборки, тёмная атмосфера — и возможность стать автором.'
  },
  {
    id: 'submit',
    title: 'Напиши свой кошмар.',
    content: 'У каждого есть история, которую страшно рассказать. Отправь свою — модераторы проверят и опубликуют. Читатели не забудут.',
    showButton: true,
    buttonText: 'Предложить историю'
  },
  {
    id: 'join',
    title: 'Не читай в одиночестве.',
    content: 'Присоединяйся к сообществу тех, кто не боится темноты. Или боится — но всё равно читает дальше.',
    showButton: true,
    buttonText: 'Присоединиться'
  },
]
