
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import RoleSelector from "./RoleSelector";

interface RegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin: () => void;
}

const RegisterModal = ({ open, onOpenChange, onSwitchToLogin }: RegisterModalProps) => {
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "", confirmPassword: "", school: "", grade: "", role: "student"
  });
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const { t } = useLanguage();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return;
    setIsLoading(true);
    try {
      await signUp(formData.email, formData.password, {
        first_name: formData.firstName, last_name: formData.lastName, school: formData.school, grade: formData.grade,
      });
      onOpenChange(false);
      setFormData({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "", school: "", grade: "", role: "student" });
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <UserPlus className="h-8 w-8 text-emerald-600 mr-2" />
            <DialogTitle className="text-2xl font-bold text-gray-800">{t('auth.registerTitle')}</DialogTitle>
          </div>
        </DialogHeader>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('auth.firstName')}</Label>
              <Input id="firstName" placeholder="Abebe" value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t('auth.lastName')}</Label>
              <Input id="lastName" placeholder="Tadesse" value={formData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{t('auth.email')}</Label>
            <Input id="email" type="email" placeholder={t('auth.emailPlaceholder')} value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="school">{t('auth.school')}</Label>
            <Input id="school" placeholder={t('auth.schoolPlaceholder')} value={formData.school} onChange={(e) => handleInputChange("school", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grade">{t('auth.grade')}</Label>
            <Select value={formData.grade} onValueChange={(value) => handleInputChange("grade", value)}>
              <SelectTrigger><SelectValue placeholder={t('auth.selectGrade')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="grade-9">{t('auth.grade9')}</SelectItem>
                <SelectItem value="grade-10">{t('auth.grade10')}</SelectItem>
                <SelectItem value="grade-11">{t('auth.grade11')}</SelectItem>
                <SelectItem value="grade-12">{t('auth.grade12')}</SelectItem>
                <SelectItem value="university">{t('auth.university')}</SelectItem>
                <SelectItem value="adult">{t('auth.adultLearner')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t('auth.password')}</Label>
            <Input id="password" type="password" placeholder={t('auth.createPasswordPlaceholder')} value={formData.password} onChange={(e) => handleInputChange("password", e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
            <Input id="confirmPassword" type="password" placeholder={t('auth.confirmPasswordPlaceholder')} value={formData.confirmPassword} onChange={(e) => handleInputChange("confirmPassword", e.target.value)} required />
          </div>
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
            {isLoading ? t('auth.creatingAccount') : t('auth.createAccount')}
          </Button>
          <div className="text-center text-sm text-gray-600">
            {t('auth.hasAccount')}{" "}
            <button type="button" className="text-emerald-600 hover:underline" onClick={() => { onOpenChange(false); onSwitchToLogin(); }}>
              {t('auth.signInHere')}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModal;
