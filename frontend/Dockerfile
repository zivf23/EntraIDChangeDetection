# =======================================================
# FILENAME: frontend/Dockerfile (Correct, Production-Ready Version)
# =======================================================

# --- שלב 1: בניית אפליקציית ה-React (Builder Stage) ---
# שימוש באימג' של Node.js כדי לבנות את הקבצים הסטטיים
FROM node:18-alpine AS builder

# הגדרת ספריית העבודה
WORKDIR /app

# העתק רק את קבצי התלויות כדי לנצל את ה-cache של דוקר
COPY package.json package-lock.json ./

# התקן את התלויות של הפרויקט
RUN npm install

# העתק את כל שאר קוד המקור של ה-frontend
COPY . .

# הרץ את פקודת ה-build כדי ליצור את תיקיית ה-`build` הסופית
RUN npm run build

# --- שלב 2: הגשת האפליקציה עם Nginx (Final Stage) ---
# שימוש באימג' קל של Nginx, שרק מגיש קבצים סטטיים
FROM nginx:stable-alpine

# העתק רק את התוצאה הסופית (תיקיית ה-build) מהשלב הקודם
COPY --from=builder /app/build /usr/share/nginx/html

# העתק את קובץ הקונפיגורציה של Nginx (ניצור אותו בשלב הבא)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# חשוף את פורט 80 והרץ את שרת ה-Nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]