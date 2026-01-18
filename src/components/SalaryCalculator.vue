<script setup>
import { ref, computed } from 'vue'
import { Calculator, TrendingUp, TrendingDown } from 'lucide-vue-next'
import Card from './ui/Card.vue'
import CardContent from './ui/CardContent.vue'
import Input from './ui/Input.vue'
import Label from './ui/Label.vue'

const brutSalary = ref('')
const netSalary = ref('')
const mode = ref('brut-to-net') // 'brut-to-net' or 'net-to-brut'

// French tax rates (simplified - actual rates vary by bracket and situation)
const CHARGES_RATE = 0.23 // ~23% social charges for employees

const calculatedNet = computed(() => {
    if (!brutSalary.value || mode.value !== 'brut-to-net') return ''
    const brut = parseFloat(brutSalary.value)
    if (isNaN(brut)) return ''
    return (brut * (1 - CHARGES_RATE)).toFixed(2)
})

const calculatedBrut = computed(() => {
    if (!netSalary.value || mode.value !== 'net-to-brut') return ''
    const net = parseFloat(netSalary.value)
    if (isNaN(net)) return ''
    return (net / (1 - CHARGES_RATE)).toFixed(2)
})

const monthlyNet = computed(() => {
    const value = mode.value === 'brut-to-net' ? calculatedNet.value : netSalary.value
    if (!value) return ''
    return (parseFloat(value) / 12).toFixed(2)
})

const monthlyBrut = computed(() => {
    const value = mode.value === 'net-to-brut' ? calculatedBrut.value : brutSalary.value
    if (!value) return ''
    return (parseFloat(value) / 12).toFixed(2)
})

function switchMode() {
    mode.value = mode.value === 'brut-to-net' ? 'net-to-brut' : 'brut-to-net'
    brutSalary.value = ''
    netSalary.value = ''
}
</script>

<template>
    <Card>
        <CardContent class="p-6">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-2">
                    <Calculator class="h-5 w-5 text-primary" />
                    <h3 class="text-lg font-semibold">Salary Calculator</h3>
                </div>
                <button
                    @click="switchMode"
                    class="text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                >
                    {{ mode === 'brut-to-net' ? 'Switch to Net → Brut' : 'Switch to Brut → Net' }}
                </button>
            </div>

            <div class="space-y-6">
                <!-- Brut to Net Mode -->
                <div v-if="mode === 'brut-to-net'" class="space-y-4">
                    <div class="space-y-2">
                        <Label for="brut-annual">Annual Gross Salary (€)</Label>
                        <Input
                            id="brut-annual"
                            v-model="brutSalary"
                            type="number"
                            placeholder="50000"
                            step="1000"
                        />
                    </div>

                    <div v-if="calculatedNet" class="space-y-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-green-900 dark:text-green-100">Annual Net</span>
                            <span class="text-lg font-bold text-green-600 dark:text-green-400">{{ parseFloat(calculatedNet).toLocaleString('fr-FR') }} €</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-green-700 dark:text-green-300">Monthly Net</span>
                            <span class="text-base font-semibold text-green-600 dark:text-green-400">{{ parseFloat(monthlyNet).toLocaleString('fr-FR') }} €</span>
                        </div>
                        <div class="flex items-center justify-between pt-2 border-t border-green-200 dark:border-green-800">
                            <span class="text-xs text-green-600 dark:text-green-400">Social charges (~23%)</span>
                            <span class="text-xs font-medium text-green-600 dark:text-green-400">
                                -{{ (parseFloat(brutSalary) - parseFloat(calculatedNet)).toLocaleString('fr-FR') }} €
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Net to Brut Mode -->
                <div v-else class="space-y-4">
                    <div class="space-y-2">
                        <Label for="net-annual">Annual Net Salary (€)</Label>
                        <Input
                            id="net-annual"
                            v-model="netSalary"
                            type="number"
                            placeholder="38500"
                            step="1000"
                        />
                    </div>

                    <div v-if="calculatedBrut" class="space-y-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                        <div class="flex items-center justify-between">
                            <span class="text-sm font-medium text-blue-900 dark:text-blue-100">Annual Gross</span>
                            <span class="text-lg font-bold text-blue-600 dark:text-blue-400">{{ parseFloat(calculatedBrut).toLocaleString('fr-FR') }} €</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-blue-700 dark:text-blue-300">Monthly Gross</span>
                            <span class="text-base font-semibold text-blue-600 dark:text-blue-400">{{ parseFloat(monthlyBrut).toLocaleString('fr-FR') }} €</span>
                        </div>
                        <div class="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-800">
                            <span class="text-xs text-blue-600 dark:text-blue-400">Social charges (~23%)</span>
                            <span class="text-xs font-medium text-blue-600 dark:text-blue-400">
                                -{{ (parseFloat(calculatedBrut) - parseFloat(netSalary)).toLocaleString('fr-FR') }} €
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Info -->
                <div class="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    <p class="font-medium mb-1">ℹ️ Note</p>
                    <p>This calculator uses a simplified rate of ~23% for social charges. Actual rates may vary based on your situation, company, and tax bracket.</p>
                </div>
            </div>
        </CardContent>
    </Card>
</template>
