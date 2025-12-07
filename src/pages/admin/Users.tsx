import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, Button, Modal, Input } from '../../components/UI';
import { Plus, Edit2, Trash2, Search, X, FileSpreadsheet } from 'lucide-react';
import type { User, Role, Parent } from '../../types';
import { read, utils } from 'xlsx';
import { toast } from 'react-hot-toast';

const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const { users, addUser, updateUser, deleteUser } = useData();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<Role | 'all'>('all');

    // Form state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<Role>('student');
    const [phone, setPhone] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');

    // Get students for parent linking
    const students = users.filter(u => u.role === 'student');

    const handleOpenNew = () => {
        setEditingUser(null);
        setName('');
        setEmail('');
        setRole('student');
        setPhone('');
        setBirthDate('');
        setSelectedStudentId('');
        setIsModalOpen(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        setPhone(user.phone || '');
        setBirthDate(user.birthDate || '');

        // If editing a parent, try to find their linked student
        if (user.role === 'parent') {
            const parent = user as Parent;
            if (parent.childrenIds && parent.childrenIds.length > 0) {
                setSelectedStudentId(parent.childrenIds[0]);
            } else {
                setSelectedStudentId('');
            }
        } else {
            setSelectedStudentId('');
        }

        setIsModalOpen(true);
    };

    const handleSave = () => {
        if (!name || !email) {
            toast.error('Veuillez remplir les champs obligatoires');
            return;
        }

        const userData: any = {
            name,
            email,
            role,
            phone: (role === 'teacher' || role === 'parent') ? phone : undefined,
            birthDate: role === 'student' ? birthDate : undefined,
            avatar: name.charAt(0).toUpperCase()
        };

        // Handle parent-student linking
        if (role === 'parent' && selectedStudentId) {
            userData.childrenIds = [selectedStudentId];
        }

        if (editingUser) {
            updateUser(editingUser.id, userData);
            toast.success('Utilisateur mis à jour');
        } else {
            const newUser: User = {
                id: `u${Date.now()}`,
                ...userData
            };
            addUser(newUser);

            // Simulate sending password via email
            toast.success(`Utilisateur créé ! Un email pour configurer le mot de passe a été envoyé à ${email}`, {
                duration: 5000,
                icon: '📧'
            });
        }
        setIsModalOpen(false);
    };

    const handleDelete = (userId: string) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            deleteUser(userId);
            toast.success('Utilisateur supprimé');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
            const workbook = read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = utils.sheet_to_json(worksheet);

            let importedCount = 0;

            for (const row of jsonData as any[]) {
                if (row.name && row.email && row.role) {
                    const newUser: any = {
                        id: `u${Date.now() + Math.random()}`,
                        name: row.name,
                        email: row.email,
                        role: row.role.toLowerCase(),
                        phone: row.phone,
                        birthDate: row.birthDate,
                        avatar: row.name.charAt(0).toUpperCase()
                    };

                    // Handle parent linking via student email in Excel
                    if (newUser.role === 'parent' && row.studentEmail) {
                        const student = users.find(u => u.email === row.studentEmail && u.role === 'student');
                        if (student) {
                            newUser.childrenIds = [student.id];
                        }
                    }

                    addUser(newUser);
                    importedCount++;
                }
            }

            toast.success(`${importedCount} utilisateurs importés avec succès`);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            console.error('Error importing file:', error);
            toast.error('Erreur lors de l\'importation du fichier');
        }
    };

    // Filter users
    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || u.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const roleCounts = {
        all: users.length,
        student: users.filter(u => u.role === 'student').length,
        teacher: users.filter(u => u.role === 'teacher').length,
        parent: users.filter(u => u.role === 'parent').length,
        director: users.filter(u => u.role === 'director').length,
        superadmin: users.filter(u => u.role === 'superadmin').length
    };

    const roleColors: Record<Role, string> = {
        student: 'bg-blue-100 text-blue-700',
        teacher: 'bg-orange-100 text-orange-700',
        parent: 'bg-purple-100 text-purple-700',
        director: 'bg-green-100 text-green-700',
        superadmin: 'bg-red-100 text-red-700'
    };

    if (currentUser?.role !== 'director' && currentUser?.role !== 'superadmin') {
        return (
            <div className="flex items-center justify-center h-96">
                <Card className="p-8 text-center">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Accès restreint</h2>
                    <p className="text-gray-600">Cette page est réservée aux directeurs et super-administrateurs.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                    />
                    <Button variant="secondary" icon={FileSpreadsheet} onClick={() => fileInputRef.current?.click()}>
                        Importer Excel
                    </Button>
                    <Button variant="primary" icon={Plus} onClick={handleOpenNew}>
                        Nouvel utilisateur
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {(['all', 'student', 'teacher', 'parent', 'director', 'superadmin'] as const).map(roleFilter => (
                    <Card
                        key={roleFilter}
                        className={`p-4 cursor-pointer transition-all ${filterRole === roleFilter ? 'ring-2 ring-orange-500 bg-orange-50' : 'hover:shadow-md'
                            }`}
                        onClick={() => setFilterRole(roleFilter)}
                    >
                        <p className="text-xs text-gray-500 font-medium mb-1 capitalize">
                            {roleFilter === 'all' ? 'Total' : roleFilter}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">{roleCounts[roleFilter]}</p>
                    </Card>
                ))}
            </div>

            {/* Search Bar */}
            <Card className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Rechercher par nom ou email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                    />
                </div>
            </Card>

            {/* Users Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Utilisateur</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rôle</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Info</th>
                                <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <span className="font-medium text-gray-900">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[user.role]}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {user.phone && <div>📞 {user.phone}</div>}
                                        {user.birthDate && <div>🎂 {user.birthDate}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                disabled={user.id === currentUser?.id}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Add/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                        </h2>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rôle</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value as Role)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                                disabled={!!editingUser}
                            >
                                <option value="student">Étudiant</option>
                                <option value="teacher">Enseignant</option>
                                <option value="parent">Parent</option>
                                <option value="director">Directeur</option>
                                {currentUser?.role === 'superadmin' && <option value="superadmin">Super Admin</option>}
                            </select>
                        </div>

                        <Input
                            label="Nom complet"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Jean Dupont"
                        />

                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="jean.dupont@school.ma"
                        />

                        {(role === 'teacher' || role === 'parent') && (
                            <Input
                                label="Numéro de téléphone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+212 6..."
                            />
                        )}

                        {role === 'student' && (
                            <Input
                                label="Date de naissance"
                                type="date"
                                value={birthDate}
                                onChange={(e) => setBirthDate(e.target.value)}
                            />
                        )}

                        {role === 'parent' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Enfant associé</label>
                                <select
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                                >
                                    <option value="">Sélectionner un élève...</option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.name} ({student.email})
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Sélectionnez l'élève dont ce parent est responsable.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                                Annuler
                            </Button>
                            <Button variant="primary" onClick={handleSave}>
                                {editingUser ? 'Enregistrer' : 'Créer'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default UserManagement;
