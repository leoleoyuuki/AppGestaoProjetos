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
  getDoc,
  increment,
  deleteField,
} from 'firebase/firestore';
import { addMonths } from 'date-fns';
import type { Project, CostItem, RevenueItem, UserProfile, CostItemFormData, RevenueItemFormData } from './types';
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
  
  if (costItemData.projectId && costItemData.actualAmount && costItemData.actualAmount > 0) {
    const projectDocRef = doc(firestore, `users/${userId}/projects`, costItemData.projectId);
    updateDoc(projectDocRef, {
      actualTotalCost: increment(costItemData.actualAmount)
    }).catch(error => console.error("Failed to update project total cost on add:", error));
  }
}

export async function updateCostItem(
  firestore: Firestore,
  userId: string,
  costItemId: string,
  costItemData: Record<string, any>
) {
  const costItemDocRef = doc(firestore, `users/${userId}/costItems`, costItemId);
  
  const dataToUpdate = { ...costItemData };
  
  if (dataToUpdate.projectId === null) {
    dataToUpdate.projectId = deleteField();
  }

  const data = {
    ...dataToUpdate,
    updatedAt: serverTimestamp(),
  };

  try {
    const oldCostItemSnap = await getDoc(costItemDocRef);
    if (!oldCostItemSnap.exists()) {
      console.warn("updateCostItem: Document to update not found.");
      return; 
    }
    const oldCostItem = oldCostItemSnap.data() as CostItem;

    await updateDoc(costItemDocRef, data);

    const oldProjectId = oldCostItem.projectId;
    const newProjectId = 'projectId' in costItemData && costItemData.projectId !== null
      ? costItemData.projectId as string
      : undefined;

    const oldAmount = oldCostItem.actualAmount || 0;
    const newAmount = 'actualAmount' in costItemData && typeof costItemData.actualAmount === 'number'
      ? costItemData.actualAmount
      : oldAmount;
    
    if (oldProjectId === newProjectId) {
      if (newAmount !== oldAmount && newProjectId) {
        const costIncrement = newAmount - oldAmount;
        if (costIncrement !== 0) {
            const projectDocRef = doc(firestore, `users/${userId}/projects`, newProjectId);
            await updateDoc(projectDocRef, { actualTotalCost: increment(costIncrement) });
        }
      }
    } else {
      // Project ID has changed
      if (oldProjectId && oldAmount > 0) {
        const oldProjectDocRef = doc(firestore, `users/${userId}/projects`, oldProjectId);
        await updateDoc(oldProjectDocRef, { actualTotalCost: increment(-oldAmount) });
      }
      if (newProjectId && newAmount > 0) {
        const newProjectDocRef = doc(firestore, `users/${userId}/projects`, newProjectId);
        await updateDoc(newProjectDocRef, { actualTotalCost: increment(newAmount) });
      }
    }
  } catch (error) {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: costItemDocRef.path,
        operation: 'update',
        requestResourceData: data,
      })
    );
    console.error("updateCostItem failed:", error);
  }
}

export function deleteCostItem(
  firestore: Firestore,
  userId: string,
  costItem: CostItem
) {
  const costItemDocRef = doc(firestore, `users/${userId}/costItems`, costItem.id);
  deleteDoc(costItemDocRef).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: costItemDocRef.path,
        operation: 'delete',
      })
    );
  });

  if (costItem.projectId && costItem.actualAmount && costItem.actualAmount > 0) {
    const projectDocRef = doc(firestore, `users/${userId}/projects`, costItem.projectId);
    updateDoc(projectDocRef, {
      actualTotalCost: increment(-costItem.actualAmount)
    }).catch(error => console.error("Failed to update project total cost on delete:", error));
  }
}

export function payCostItem(
  firestore: Firestore,
  userId: string,
  costItem: CostItem
) {
  const costItemDocRef = doc(firestore, `users/${userId}/costItems`, costItem.id);
  const data = {
    status: 'Pago' as const,
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

  const costIncrement = data.actualAmount - (costItem.actualAmount || 0);
  if (costItem.projectId && costIncrement !== 0) {
    const projectDocRef = doc(firestore, `users/${userId}/projects`, costItem.projectId);
    updateDoc(projectDocRef, {
      actualTotalCost: increment(costIncrement)
    }).catch(error => console.error("Failed to update project total cost on pay:", error));
  }

  if (costItem.isRecurring && costItem.frequency === 'monthly') {
    const originalDate = new Date(`${costItem.transactionDate}T00:00:00`);
    const nextDate = addMonths(originalDate, 1);

    const { id, createdAt, updatedAt, deviationAnalysisNote, ...clonedData } = costItem;

    const nextCostItemData = {
      ...clonedData,
      status: 'Pendente' as const,
      actualAmount: 0,
      transactionDate: nextDate.toISOString().split('T')[0],
      isInstallment: false,
      installmentNumber: undefined,
      totalInstallments: undefined,
    };
    
    const cleanData = Object.fromEntries(Object.entries(nextCostItemData).filter(([, v]) => v !== undefined));
    
    addCostItem(firestore, userId, cleanData as CostItemFormData);
  }
}

export function unpayCostItem(
  firestore: Firestore,
  userId: string,
  costItem: CostItem
) {
  const costItemDocRef = doc(firestore, `users/${userId}/costItems`, costItem.id);
  
  const costDecrement = costItem.actualAmount || 0;

  const data = {
    status: 'Pendente' as const,
    actualAmount: 0,
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

  if (costItem.projectId && costDecrement > 0) {
    const projectDocRef = doc(firestore, `users/${userId}/projects`, costItem.projectId);
    updateDoc(projectDocRef, {
      actualTotalCost: increment(-costDecrement)
    }).catch(error => console.error("Failed to update project total cost on un-pay:", error));
  }
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

  if (revenueItemData.receivedAmount && revenueItemData.receivedAmount > 0) {
    const projectDocRef = doc(firestore, `users/${userId}/projects`, projectId);
    updateDoc(projectDocRef, {
      actualTotalRevenue: increment(revenueItemData.receivedAmount)
    }).catch(error => console.error("Failed to update project total revenue on add:", error));
  }
}

export async function updateRevenueItem(
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
  
  try {
    const oldRevenueItemSnap = await getDoc(revenueItemDocRef);
    if (!oldRevenueItemSnap.exists()) {
      console.warn("updateRevenueItem: Document to update not found.");
      return;
    }
    const oldRevenueItem = oldRevenueItemSnap.data() as RevenueItem;

    await updateDoc(revenueItemDocRef, data);
    
    const oldAmount = oldRevenueItem.receivedAmount || 0;
    const newAmount = 'receivedAmount' in revenueItemData && typeof revenueItemData.receivedAmount === 'number'
      ? revenueItemData.receivedAmount
      : oldAmount;

    const revenueIncrement = newAmount - oldAmount;
    
    if (revenueIncrement !== 0) {
       const projectDocRef = doc(firestore, `users/${userId}/projects`, projectId);
       await updateDoc(projectDocRef, { actualTotalRevenue: increment(revenueIncrement) });
    }
  } catch (error) {
     errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: revenueItemDocRef.path,
        operation: 'update',
        requestResourceData: data,
      })
    );
    console.error("updateRevenueItem failed:", error);
  }
}

export function deleteRevenueItem(
  firestore: Firestore,
  userId: string,
  revenueItem: RevenueItem
) {
  const revenueItemDocRef = doc(firestore, `users/${userId}/projects/${revenueItem.projectId}/revenueItems`, revenueItem.id);
  deleteDoc(revenueItemDocRef).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: revenueItemDocRef.path,
        operation: 'delete',
      })
    );
  });

  if (revenueItem.receivedAmount && revenueItem.receivedAmount > 0) {
    const projectDocRef = doc(firestore, `users/${userId}/projects`, revenueItem.projectId);
    updateDoc(projectDocRef, {
      actualTotalRevenue: increment(-revenueItem.receivedAmount)
    }).catch(error => console.error("Failed to update project total revenue on delete:", error));
  }
}

export function receiveRevenueItem(
  firestore: Firestore,
  userId: string,
  revenueItem: RevenueItem
) {
  const revenueItemDocRef = doc(firestore, `users/${userId}/projects/${revenueItem.projectId}/revenueItems`, revenueItem.id);
  const data = {
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
  
  const revenueIncrement = data.receivedAmount - (revenueItem.receivedAmount || 0);
  if (revenueIncrement !== 0) {
    const projectDocRef = doc(firestore, `users/${userId}/projects`, revenueItem.projectId);
    updateDoc(projectDocRef, {
      actualTotalRevenue: increment(revenueIncrement)
    }).catch(error => console.error("Failed to update project total revenue on receive:", error));
  }
}

export function unreceiveRevenueItem(
  firestore: Firestore,
  userId: string,
  revenueItem: RevenueItem
) {
  const revenueItemDocRef = doc(firestore, `users/${userId}/projects/${revenueItem.projectId}/revenueItems`, revenueItem.id);
  
  const revenueDecrement = revenueItem.receivedAmount || 0;
  
  const data = {
    receivedAmount: 0,
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
  
  if (revenueDecrement > 0) {
    const projectDocRef = doc(firestore, `users/${userId}/projects`, revenueItem.projectId);
    updateDoc(projectDocRef, {
      actualTotalRevenue: increment(-revenueDecrement)
    }).catch(error => console.error("Failed to update project total revenue on un-receive:", error));
  }
}
