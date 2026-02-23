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
import type { Project, CostItem, RevenueItem, UserProfile } from './types';
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

  setDoc(userDocRef, data).catch((error) => {
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

export type CostItemFormData = Omit<CostItem, 'id' | 'createdAt' | 'updatedAt'>;

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


// --- RevenueItem Actions ---

export type RevenueItemFormData = Omit<RevenueItem, 'id' | 'createdAt' | 'updatedAt' | 'paymentMethodId'>;

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
