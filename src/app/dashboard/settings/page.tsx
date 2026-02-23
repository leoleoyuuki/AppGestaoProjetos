'use client';
import SettingsForm from "@/components/dashboard/settings-form";
import { CostCategoryManager } from "@/components/dashboard/settings/cost-category-manager";

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Configurações</h1>
            <SettingsForm />
            <CostCategoryManager />
        </div>
    );
}
