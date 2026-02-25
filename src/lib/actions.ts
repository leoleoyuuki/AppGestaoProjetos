'use client';

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore';
import { addMonths } from 'date-fns';
import type { Project, CostItem, RevenueItem, UserProfile, CostItemFormData, RevenueItemFormData, FixedCost, FixedCostFormData } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// --- UserProfile Actions ---

export function createUserProfile(
  firestore: Firestore,
  userId: string,
  email: string | null,
  name: string
) {
  const userDocRef = doc(firestore, `users/${userId}`);
  const data = {
    id: userId,
    email: email || '',
    name: name,
    initialCashBalance: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const setPromise = setDoc(userDocRef, data);
  
  setPromise.catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'create',
        requestResourceData: data,
      })
    );
  });

  // Seed default cost categories for the new user
  const defaultCategories = ['Mão de obra', 'Materiais', 'Marketing', 'Software', 'Outros'];
  const categoriesColRef = collection(firestore, `users/${userId}/costCategories`);
  for (const categoryName of defaultCategories) {
      const categoryData = {
          name: categoryName,
          userId: userId,
          createdAt: serverTimestamp(),
      };
      // We don't block or show detailed errors for this, as it's a background setup task.
      addDoc(categoriesColRef, categoryData).catch(error => {
          console.warn(`Could not seed category '${categoryName}':`, error);
      });
  }
  
  return setPromise;
}

export function updateUserProfile(
  firestore: Firestore,
  userId: string,
  profileData: Partial<{ name: string; initialCashBalance: number }>
) {
  const userDocRef = doc(firestore, `users/${userId}`);
  const data = {
    ...profileData,
    updatedAt: serverTimestamp(),
  };

  updateDoc(userDocRef, data).catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: data,
      })
    );
  });
}


// --- Project Actions ---

export type ProjectFormData = Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'actualTotalCost' | 'actualTotalRevenue'>;

export function addProject(
  firestore: Firestore,
  userId: string,
  projectData: ProjectFormData
) {
  const projectsColRef = collection(firestore, `users/${userId}/projects`);
  const data = {
    ...projectData,
    userId,
    actualTotalCost: 0,
    actualTotalRevenue: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  addDoc(projectsColRef, data).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: projectsColRef.path,
        operation: 'create',
        requestResourceData: data,
      })
    );
  });
}

export function updateProject(
  firestore: Firestore,
  userId: string,
  projectId: string,
  projectData: Partial<ProjectFormData>
) {
  const projectDocRef = doc(firestore, `users/${userId}/projects`, projectId);
  const data = {
    ...projectData,
    updatedAt: serverTimestamp(),
  };

  updateDoc(projectDocRef, data).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: projectDocRef.path,
        operation: 'update',
        requestResourceData: data,
      })
    );
  });
}

export function deleteProject(
  firestore: Firestore,
  userId: string,
  projectId: string
) {
  const projectDocRef = doc(firestore, `users/${userId}/projects`, projectId);
  deleteDoc(projectDocRef).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: projectDocRef.path,
        operation: 'delete',
      })
    );
    // Note: This does not delete subcollections like costItems and revenueItems.
    // A cloud function would be needed for cascading deletes.
  });
}

// --- CostCategory Actions ---

export function addCostCategory(
  firestore: Firestore,
  userId: string,
  categoryName: string
) {
  const categoriesColRef = collection(firestore, `users/${userId}/costCategories`);
  const data = {
    name: categoryName,
    userId: userId,
    createdAt: serverTimestamp(),
  };

  addDoc(categoriesColRef, data).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: categoriesColRef.path,
        operation: 'create',
        requestResourceData: data,
      })
    );
  });
}

export function deleteCostCategory(
  firestore: Firestore,
  userId: string,
  categoryId: string
) {
  const categoryDocRef = doc(firestore, `users/${userId}/costCategories`, categoryId);
  deleteDoc(categoryDocRef).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: categoryDocRef.path,
        operation: 'delete',
      })
    );
  });
}


// --- CostItem Actions ---

export function addCostItem(
  firestore: Firestore,
  userId: string,
  costItemData: CostItemFormData
) {
  const costItemsColRef = collection(firestore, `users/${userId}/costItems`);
  const data = {
    ...costItemData,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  addDoc(costItemsColRef, data).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: costItemsColRef.path,
        operation: 'create',
        requestResourceData: data,
      })
    );
  });
}

export function updateCostItem(
  firestore: Firestore,
  userId: string,
  costItemId: string,
  costItemData: Partial<CostItemFormData>
) {
  const costItemDocRef = doc(firestore, `users/${userId}/costItems`, costItemId);
  const data = {
    ...costItemData,
    updatedAt: serverTimestamp(),
  };
  
  updateDoc(costItemDocRef, data).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: costItemDocRef.path,
        operation: 'update',
        requestResourceData: data,
      })
    );
  });
}

export function deleteCostItem(
  firestore: Firestore,
  userId: string,
  costItemId: string
) {
  const costItemDocRef = doc(firestore, `users/${userId}/costItems`, costItemId);
  deleteDoc(costItemDocRef).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: costItemDocRef.path,
        operation: 'delete',
      })
    );
  });
}

export function payCostItem(
  firestore: Firestore,
  userId: string,
  costItem: CostItem
) {
  const costItemDocRef = doc(firestore, `users/${userId}/costItems`, costItem.id);
  const data = {
    status: 'Pago' as const,
    // When paying, set the actual amount to planned amount if it's not already set.
    actualAmount: costItem.actualAmount > 0 ? costItem.actualAmount : costItem.plannedAmount,
    updatedAt: serverTimestamp(),
  };

  updateDoc(costItemDocRef, data).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: costItemDocRef.path,
        operation: 'update',
        requestResourceData: data,
      })
    );
  });
}

// --- FixedCost Actions ---

export function addFixedCost(firestore: Firestore, userId: string, fixedCostData: FixedCostFormData) {
    const fixedCostsColRef = collection(firestore, `users/${userId}/fixedCosts`);
    const data = {
        ...fixedCostData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    addDoc(fixedCostsColRef, data).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: fixedCostsColRef.path,
            operation: 'create',
            requestResourceData: data,
        }));
    });
}

export function updateFixedCost(firestore: Firestore, userId: string, fixedCostId: string, fixedCostData: Partial<FixedCostFormData>) {
    const fixedCostDocRef = doc(firestore, `users/${userId}/fixedCosts`, fixedCostId);
    const data = {
        ...fixedCostData,
        updatedAt: serverTimestamp(),
    };
    updateDoc(fixedCostDocRef, data).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: fixedCostDocRef.path,
            operation: 'update',
            requestResourceData: data,
        }));
    });
}

export function deleteFixedCost(firestore: Firestore, userId: string, fixedCostId: string) {
    const fixedCostDocRef = doc(firestore, `users/${userId}/fixedCosts`, fixedCostId);
    deleteDoc(fixedCostDocRef).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: fixedCostDocRef.path,
            operation: 'delete',
        }));
    });
}

export function generateCostItemFromFixedCost(firestore: Firestore, userId: string, fixedCost: FixedCost) {
    const costItemsColRef = collection(firestore, `users/${userId}/costItems`);
    const costItemData = {
        name: fixedCost.name,
        category: fixedCost.category,
        plannedAmount: fixedCost.amount,
        transactionDate: fixedCost.nextPaymentDate,
        description: `Lançamento referente ao custo fixo: ${fixedCost.name}`,
        userId: userId,
        actualAmount: 0,
        status: 'Pendente' as const,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };
    addDoc(costItemsColRef, costItemData).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: costItemsColRef.path,
            operation: 'create',
            requestResourceData: costItemData,
        }));
    });

    const fixedCostDocRef = doc(firestore, `users/${userId}/fixedCosts`, fixedCost.id);
    const originalDate = new Date(`${fixedCost.nextPaymentDate}T00:00:00`);
    const nextDate = addMonths(originalDate, 1);
    const updatedFixedCostData = {
        nextPaymentDate: nextDate.toISOString().split('T')[0],
    };
    updateDoc(fixedCostDocRef, updatedFixedCostData).catch(error => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: fixedCostDocRef.path,
            operation: 'update',
            requestResourceData: updatedFixedCostData,
        }));
    });
}


// --- RevenueItem Actions ---

export function addRevenueItem(
  firestore: Firestore,
  userId: string,
  projectId: string,
  revenueItemData: RevenueItemFormData
) {
  const revenueItemsColRef = collection(firestore, `users/${userId}/projects/${projectId}/revenueItems`);
  const data = {
    ...revenueItemData,
    userId,
    projectId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  addDoc(revenueItemsColRef, data).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: revenueItemsColRef.path,
        operation: 'create',
        requestResourceData: data,
      })
    );
  });
}

export function updateRevenueItem(
  firestore: Firestore,
  userId: string,
  projectId: string,
  revenueItemId: string,
  revenueItemData: Partial<RevenueItemFormData>
) {
  const revenueItemDocRef = doc(firestore, `users/${userId}/projects/${projectId}/revenueItems`, revenueItemId);
  const data = {
    ...revenueItemData,
    updatedAt: serverTimestamp(),
  };
  
  updateDoc(revenueItemDocRef, data).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: revenueItemDocRef.path,
        operation: 'update',
        requestResourceData: data,
      })
    );
  });
}

export function deleteRevenueItem(
  firestore: Firestore,
  userId: string,
  projectId: string,
  revenueItemId: string
) {
  const revenueItemDocRef = doc(firestore, `users/${userId}/projects/${projectId}/revenueItems`, revenueItemId);
  deleteDoc(revenueItemDocRef).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: revenueItemDocRef.path,
        operation: 'delete',
      })
    );
  });
}

export function receiveRevenueItem(
  firestore: Firestore,
  userId: string,
  revenueItem: RevenueItem
) {
  const revenueItemDocRef = doc(firestore, `users/${userId}/projects/${revenueItem.projectId}/revenueItems`, revenueItem.id);
  const data = {
    // When receiving, set the received amount to planned amount if it's not already set.
    receivedAmount: revenueItem.receivedAmount > 0 ? revenueItem.receivedAmount : revenueItem.plannedAmount,
    updatedAt: serverTimestamp(),
  };

  updateDoc(revenueItemDocRef, data).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: revenueItemDocRef.path,
        operation: 'update',
        requestResourceData: data,
      })
    );
  });
}
