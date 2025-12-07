import { useState, useEffect } from 'react';
import { Modal, Input, Button } from '../UI';
import { useData } from '../../context/DataContext';
import { X, Plus } from 'lucide-react';
import type { Event } from '../../types';
import { toast } from 'react-hot-toast';

interface ExamModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Omit<Event, 'id'>) => Promise<void>;
    editingEvent?: Event | null;
    classId?: string;
    teacherId: string;
}

const ExamModal = ({ isOpen, onClose, onSave, editingEvent, classId: propClassId, teacherId }: ExamModalProps) => {
    const { classes } = useData();
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [classId, setClassId] = useState(propClassId || '');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('10:00');
    const [endTime, setEndTime] = useState('12:00');
    const [room, setRoom] = useState('');

    useEffect(() => {
        if (editingEvent) {
            setTitle(editingEvent.title);
            setDescription(editingEvent.description);
            setClassId(editingEvent.classId || '');

            const startDate = new Date(editingEvent.start);
            const endDate = new Date(editingEvent.end);

            setDate(startDate.toISOString().split('T')[0]);
            setStartTime(startDate.toTimeString().slice(0, 5));
            setEndTime(endDate.toTimeString().slice(0, 5));

            // Event type doesn't strictly have 'room', but we might want to add it or put it in description
            // For now, let's assume description might contain room info or we just don't support it explicitly in Event type yet.
            // Actually, let's check Event type. It has 'location' maybe?
            // Checking types/index.ts: interface Event { id, title, description, start, end, type, classId? }
            // No room/location. I'll append it to description or ignore for now.
        } else {
            // Reset form
            setTitle('');
            setDescription('');
            if (!propClassId) setClassId('');
            setDate('');
            setStartTime('10:00');
            setEndTime('12:00');
            setRoom('');
        }
    }, [editingEvent, isOpen, propClassId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date || !startTime || !endTime || !classId) {
            toast.error('Veuillez remplir tous les champs obligatoires');
            return;
        }

        setLoading(true);
        try {
            const startDateTime = new Date(`${date}T${startTime}`);
            const endDateTime = new Date(`${date}T${endTime}`);

            const eventData: Omit<Event, 'id'> = {
                title,
                description: room ? `${description} (Salle: ${room})` : description,
                start: startDateTime.toISOString(),
                end: endDateTime.toISOString(),
                type: 'exam',
                classId
            };

            await onSave(eventData);
            toast.success(editingEvent ? 'Examen modifié avec succès' : 'Examen ajouté avec succès');
            onClose();
        } catch (error) {
            console.error('Error saving exam:', error);
            toast.error("Erreur lors de l'enregistrement de l'examen");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {editingEvent ? 'Modifier l\'examen' : 'Ajouter un examen'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Class Selection */}
                    {!propClassId && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Classe *</label>
                            <select
                                value={classId}
                                onChange={(e) => setClassId(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                                required
                            >
                                <option value="">Sélectionner une classe</option>
                                {classes
                                    .filter(c => c.teacherId === teacherId)
                                    .map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                            </select>
                        </div>
                    )}

                    <Input
                        label="Titre de l'examen *"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Examen de Mathématiques - Algèbre"
                        required
                    />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                            placeholder="Détails sur le contenu, matériel requis..."
                        />
                    </div>

                    <Input
                        label="Date *"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Heure de début *"
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            required
                        />
                        <Input
                            label="Heure de fin *"
                            type="time"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            required
                        />
                    </div>

                    <Input
                        label="Salle (optionnel)"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                        placeholder="Ex: Salle 101"
                    />

                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={onClose} type="button">
                            Annuler
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading} icon={Plus}>
                            {loading ? 'Enregistrement...' : (editingEvent ? 'Modifier' : 'Ajouter')}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default ExamModal;
