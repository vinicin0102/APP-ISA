import { useState, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
    addMonths,
    subMonths,
    isSameMonth,
    isSameDay,
    isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './Calendar.css';

function Calendar({ selectedDate, onSelectDate, userId }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [datesWithNotes, setDatesWithNotes] = useState(new Set());
    const [animDirection, setAnimDirection] = useState('');

    useEffect(() => {
        loadDatesWithNotes();
    }, [currentMonth, userId]);

    const loadDatesWithNotes = async () => {
        const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

        const { data } = await supabase
            .from('agenda_notes')
            .select('date')
            .eq('user_id', userId)
            .gte('date', start)
            .lte('date', end);

        if (data) {
            setDatesWithNotes(new Set(data.map((d) => d.date)));
        }
    };

    const prevMonth = () => {
        setAnimDirection('slide-right');
        setTimeout(() => {
            setCurrentMonth(subMonths(currentMonth, 1));
            setAnimDirection('');
        }, 150);
    };

    const nextMonth = () => {
        setAnimDirection('slide-left');
        setTimeout(() => {
            setCurrentMonth(addMonths(currentMonth, 1));
            setAnimDirection('');
        }, 150);
    };

    const goToToday = () => {
        setCurrentMonth(new Date());
        onSelectDate(new Date());
    };

    const renderHeader = () => {
        return (
            <div className="calendar-header">
                <button className="btn btn-ghost btn-icon cal-nav-btn" onClick={prevMonth}>
                    <ChevronLeft size={20} />
                </button>

                <div className="calendar-month-label">
                    <h2>{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h2>
                </div>

                <button className="btn btn-ghost btn-icon cal-nav-btn" onClick={nextMonth}>
                    <ChevronRight size={20} />
                </button>

                <button className="btn btn-secondary btn-sm today-btn" onClick={goToToday}>
                    <CalendarDays size={14} />
                    Hoje
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return (
            <div className="calendar-weekdays">
                {days.map((day) => (
                    <div key={day} className="weekday-label">{day}</div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const rows = [];
        let days = [];
        let day = startDate;

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                const dayFormatted = format(day, 'yyyy-MM-dd');
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const hasNote = datesWithNotes.has(dayFormatted);

                const cloneDay = new Date(day);

                days.push(
                    <button
                        key={dayFormatted}
                        className={`calendar-cell ${!isCurrentMonth ? 'other-month' : ''} ${isSelected ? 'selected' : ''} ${isTodayDate ? 'today' : ''} ${hasNote ? 'has-note' : ''}`}
                        onClick={() => onSelectDate(cloneDay)}
                        disabled={!isCurrentMonth}
                    >
                        <span className="cell-day">{format(day, 'd')}</span>
                        {hasNote && <span className="cell-dot" />}
                    </button>
                );

                day = addDays(day, 1);
            }

            rows.push(
                <div key={day.toString()} className="calendar-row">
                    {days}
                </div>
            );
            days = [];
        }

        return <div className={`calendar-grid ${animDirection}`}>{rows}</div>;
    };

    return (
        <div className="calendar-container glass-card">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </div>
    );
}

export default Calendar;
