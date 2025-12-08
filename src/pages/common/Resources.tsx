import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Card, Button, Modal } from '../../components/UI';
import {
    FolderOpen,
    FileText,
    Download,
    Upload,
    Search,
    X,
    Eye,
    Trash2,
    BookOpen,
    Image,
    Video,
    File
} from 'lucide-react';

interface Resource {
    id: string;
    name: string;
    type: 'pdf' | 'doc' | 'image' | 'video' | 'other';
    subject: string;
    class: string;
    uploadedBy: string;
    uploadedAt: string;
    size: string;
    downloads: number;
}

const Resources = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const isRTL = i18n.language === 'ar';

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [fileName, setFileName] = useState('');
    const [subject, setSubject] = useState('Mathématiques');
    const [classLevel, setClassLevel] = useState('c1');

    // Sample resources
    const [resources, setResources] = useState<Resource[]>([
        {
            id: '1',
            name: 'Exercices de calcul mental',
            type: 'pdf',
            subject: 'Mathématiques',
            class: 'c1',
            uploadedBy: 'Prof. Martin',
            uploadedAt: '2024-12-06T10:00:00.000Z',
            size: '2.5 MB',
            downloads: 45
        },
        {
            id: '2',
            name: 'Guide de conjugaison',
            type: 'pdf',
            subject: 'Français',
            class: 'c1',
            uploadedBy: 'Prof. Dupont',
            uploadedAt: '2024-12-03T10:00:00.000Z',
            size: '1.8 MB',
            downloads: 62
        },
        {
            id: '3',
            name: 'Tableau périodique',
            type: 'image',
            subject: 'Sciences',
            class: 'c1',
            uploadedBy: 'Prof. Bernard',
            uploadedAt: '2024-11-28T10:00:00.000Z',
            size: '500 KB',
            downloads: 38
        }
    ]);

    const subjects = ['Mathématiques', 'Français', 'Arabe', 'Sciences', 'Histoire'];

    const filteredResources = resources.filter(r => {
        const matchesSubject = selectedSubject === 'all' || r.subject === selectedSubject;
        const matchesSearch = searchQuery === '' || r.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSubject && matchesSearch;
    });

    const handleUploadResource = () => {
        if (!fileName) return;

        const newResource: Resource = {
            id: `r${Math.random().toString(36).substring(7)}`,
            name: fileName,
            type: 'pdf',
            subject,
            class: classLevel,
            uploadedBy: user?.name || '',
            uploadedAt: new Date().toISOString(),
            size: '1.2 MB',
            downloads: 0
        };

        setResources(prev => [newResource, ...prev]);
        setIsModalOpen(false);
        setFileName('');
    };

    const getFileIcon = (type: Resource['type']) => {
        switch (type) {
            case 'pdf':
            case 'doc':
                return <FileText className="text-red-600" size={32} />;
            case 'image':
                return <Image className="text-blue-600" size={32} />;
            case 'video':
                return <Video className="text-purple-600" size={32} />;
            default:
                return <File className="text-gray-600" size={32} />;
        }
    };

    const canUpload = user?.role === 'teacher' || user?.role === 'director';

    return (
        <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{t('resources.title')}</h1>
                    <p className="text-gray-600">{t('resources.subtitle')}</p>
                </div>
                {canUpload && (
                    <Button variant="primary" icon={Upload} onClick={() => setIsModalOpen(true)}>
                        {t('resources.uploadResource')}
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="text-blue-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{t('resources.total')}</p>
                            <p className="text-2xl font-bold text-gray-900">{resources.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <FileText className="text-red-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">PDF</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {resources.filter(r => r.type === 'pdf').length}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Image className="text-purple-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{t('resources.images')}</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {resources.filter(r => r.type === 'image').length}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <Download className="text-orange-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">{t('resources.downloads')}</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {resources.reduce((sum, r) => sum + r.downloads, 0)}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={20} />
                        <input
                            type="text"
                            placeholder={t('resources.searchResources')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none`}
                        />
                    </div>
                    <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                    >
                        <option value="all">{t('resources.allSubjects')}</option>
                        {subjects.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>
            </Card>

            {/* Resources Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredResources.map(resource => (
                    <Card key={resource.id} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="p-3 bg-gray-50 rounded-xl">
                                {getFileIcon(resource.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 mb-1 line-clamp-2">{resource.name}</h3>
                                <p className="text-sm text-orange-600 font-medium">{resource.subject}</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-4 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>{t('resources.size')}:</span>
                                <span className="font-semibold">{resource.size}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('resources.downloads')}:</span>
                                <span className="font-semibold">{resource.downloads}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>{t('resources.uploadedBy')}:</span>
                                <span className="font-semibold">{resource.uploadedBy}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="primary" size="sm" icon={Download} className="flex-1">
                                {t('resources.download')}
                            </Button>
                            <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                <Eye size={18} />
                            </button>
                            {canUpload && (
                                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </Card>
                ))}
            </div>

            {filteredResources.length === 0 && (
                <Card className="p-12 text-center">
                    <FolderOpen size={48} className="mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('resources.noResources')}</h3>
                    <p className="text-gray-500">{t('resources.noResourcesDesc')}</p>
                </Card>
            )}

            {/* Upload Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">{t('resources.uploadResource')}</h2>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('resources.fileName')}</label>
                            <input
                                type="text"
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                                placeholder={t('resources.fileNamePlaceholder')}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('resources.subject')}</label>
                            <select
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                            >
                                {subjects.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('resources.class')}</label>
                            <select
                                value={classLevel}
                                onChange={(e) => setClassLevel(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                            >
                                <option value="c1">Classe 1A</option>
                                <option value="c2">Classe 1B</option>
                                <option value="c3">Classe 2A</option>
                            </select>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-orange-400 transition-colors cursor-pointer">
                            <Upload className="mx-auto mb-3 text-gray-400" size={40} />
                            <p className="text-gray-700 font-medium mb-1">{t('resources.clickToSelect')}</p>
                            <p className="text-sm text-gray-500">{t('resources.fileTypes')}</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                                {t('common.cancel')}
                            </Button>
                            <Button variant="primary" icon={Upload} onClick={handleUploadResource}>
                                {t('resources.upload')}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Resources;
