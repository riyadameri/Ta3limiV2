    require('dotenv').config();
    const express = require('express');
    const mongoose = require('mongoose');
    const { SerialPort } = require('serialport');
    const { ReadlineParser } = require('@serialport/parser-readline');
    const socketio = require('socket.io');
    const path = require('path');
    const cors = require('cors');
    const moment = require('moment');
    const jwt = require('jsonwebtoken');
    const bcrypt = require('bcryptjs');
    const nodemailer = require('nodemailer');
    const smsGateway = require('./sms-gateway-alternative');
      const ExcelJS = require('exceljs');
    const app = express();
    const server = require('http').createServer(app);
const fs = require('fs');

  // تحديث إعدادات Socket.IO
  const io = socketio(server, {
    cors: {
      origin: '*',  // Allow all origins temporarily
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization']
    },
    transports: ['websocket', 'polling'],
    path: '/socket.io/',
    serveClient: true
  });

    // Middleware
  // Add this BEFORE all other routes and middleware
  // Replace this CORS configuration in your server.js:
  // Use this CORS configuration instead:
// في server.js - استبدل إعدادات CORS بهذا الكود
const corsOptions = {
  origin: '*', // Allow any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods',
    'X-Requested-With',
    'Accept-Language',
    'Content-Language'
  ],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  credentials: false, // Must be false when using origin: '*'
  optionsSuccessStatus: 200,
  preflightContinue: false
};





// تطبيق CORS مع خيارات متقدمة
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
    credentials: true,
    optionsSuccessStatus: 200
}));


// ==============================================
// ✅ معالجة صريحة لطلبات OPTIONS (Preflight)
// ==============================================
app.options('*', cors());


// تطبيق CORS
app.use(cors(corsOptions));

// معالجة صريحة لطلبات OPTIONS
app.options('*', cors(corsOptions));
app.use((req, res, next) => {
  // Set CORS headers for all responses
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-Requested-With');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).send();
  }
  
  next();
});





    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, 'public')));

    // Database Models
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, enum: ['admin', 'secretary', 'accountant', 'teacher'], required: true },
      fullName: String,
      phone: String,
      email: String,
      createdAt: { type: Date, default: Date.now },
      active: { type: Boolean, default: true }
    });

// ==============================================
// نموذج المدرسة (نسخة مُصححة - بدون تكرار)
// ==============================================

// ==============================================
// نموذج المدرسة (School)
// ==============================================
// ==============================================
// نموذج المدرسة (School Schema) - النسخة الكاملة
// ==============================================

const schoolSchema = new mongoose.Schema({
  name: { 
      type: String, 
      required: true, 
      unique: true,
      trim: true 
  },
  email: { 
      type: String, 
      required: true, 
      unique: true,
      lowercase: true,
      trim: true 
  },
  phone: { 
      type: String, 
      required: true 
  },
  address: {
      type: String,
      default: ''
  },
  schoolKey: { 
      type: String, 
      required: true, 
      unique: true 
  },
  // نظام الاشتراك السنوي
  subscription: {
      plan: {
          type: String,
          enum: ['basic', 'standard', 'premium', 'enterprise', 'trial'],
          default: 'trial'
      },
      planName: {
          type: String,
          enum: ['تجريبي', 'أساسي', 'قياسي', 'مميز', 'مؤسسات'],
          default: 'تجريبي'
      },
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date },
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'DZD' },
      status: {
          type: String,
          enum: ['active', 'expired', 'pending', 'cancelled', 'trial'],
          default: 'trial'
      },
      paymentMethod: {
          type: String,
          enum: ['cash', 'bank_transfer', 'online', 'check', 'free'],
          default: 'free'
      },
      paymentDate: { type: Date },
      invoiceNumber: { type: String },
      notes: { type: String, default: '' },
      features: {
          maxStudents: { type: Number, default: 10 },
          maxTeachers: { type: Number, default: 3 },
          maxClasses: { type: Number, default: 5 },
          hasRFID: { type: Boolean, default: false },
          hasSMS: { type: Boolean, default: false },
          hasReports: { type: Boolean, default: false },
          hasAPI: { type: Boolean, default: false }
      },
      payments: [{
          amount: Number,
          date: { type: Date, default: Date.now },
          method: String,
          receiptNumber: String,
          notes: String
      }]
  },
  // المديرون
  admins: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      username: { type: String, required: true },
      password: { type: String, required: true },
      fullName: { type: String, required: true },
      email: String,
      phone: String,
      role: { 
          type: String, 
          enum: ['super_admin', 'admin', 'manager', 'accountant'],
          default: 'admin'
      },
      isActive: { type: Boolean, default: true },
      lastLogin: Date,
      createdAt: { type: Date, default: Date.now },
      permissions: {
          canManageStudents: { type: Boolean, default: true },
          canManageTeachers: { type: Boolean, default: true },
          canManageClasses: { type: Boolean, default: true },
          canManagePayments: { type: Boolean, default: true },
          canManageUsers: { type: Boolean, default: false },
          canViewReports: { type: Boolean, default: true },
          canManageSubscription: { type: Boolean, default: false }
      }
  }],
  settings: {
      currency: { type: String, default: 'DZD' },
      language: { type: String, default: 'ar' },
      timezone: { type: String, default: 'Africa/Algiers' }
  },
  stats: {
      totalStudents: { type: Number, default: 0 },
      totalTeachers: { type: Number, default: 0 },
      totalClasses: { type: Number, default: 0 },
      totalIncome: { type: Number, default: 0 },
      totalExpenses: { type: Number, default: 0 }
  },
  status: { 
      type: String, 
      enum: ['active', 'inactive', 'suspended', 'expired'], 
      default: 'active' 
  }
}, { 
  timestamps: true 
});

// ==============================================
// ⚠️ دوال النموذج - تأكد من وجودها هنا ⚠️
// ==============================================

// 1. توليد مفتاح مدرسة فريد
schoolSchema.statics.generateSchoolKey = function() {
  const prefix = 'SCH';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

// 2. التحقق من صلاحية الاشتراك
schoolSchema.methods.isSubscriptionActive = function() {
  if (!this.subscription || !this.subscription.endDate) return false;
  return this.subscription.status === 'active' && new Date() <= this.subscription.endDate;
};

// 3. الحصول على الأيام المتبقية في الاشتراك
schoolSchema.methods.getSubscriptionDaysRemaining = function() {
  if (!this.subscription || !this.subscription.endDate) return 0;
  if (this.subscription.status !== 'active') return 0;
  const now = new Date();
  const diff = new Date(this.subscription.endDate) - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

// 4. التحقق من انتهاء الاشتراك
schoolSchema.methods.isSubscriptionExpired = function() {
  if (!this.subscription || !this.subscription.endDate) return true;
  return new Date() > this.subscription.endDate || this.subscription.status === 'expired';
};

// 5. الحصول على ميزات الخطة
schoolSchema.methods.getPlanLimits = function() {
  const limits = {
      trial: { maxStudents: 10, maxTeachers: 3, maxClasses: 5, hasRFID: false, hasSMS: false, hasReports: false, hasAPI: false },
      basic: { maxStudents: 50, maxTeachers: 10, maxClasses: 20, hasRFID: false, hasSMS: false, hasReports: true, hasAPI: false },
      standard: { maxStudents: 150, maxTeachers: 25, maxClasses: 50, hasRFID: true, hasSMS: false, hasReports: true, hasAPI: false },
      premium: { maxStudents: 500, maxTeachers: 50, maxClasses: 100, hasRFID: true, hasSMS: true, hasReports: true, hasAPI: true },
      enterprise: { maxStudents: 9999, maxTeachers: 999, maxClasses: 999, hasRFID: true, hasSMS: true, hasReports: true, hasAPI: true }
  };
  return limits[this.subscription?.plan] || limits.trial;
};

// 6. تحديث حالة المدرسة بناءً على الاشتراك
schoolSchema.methods.updateStatusFromSubscription = function() {
  if (this.isSubscriptionActive()) {
      this.status = 'active';
  } else if (this.isSubscriptionExpired()) {
      this.status = 'expired';
  }
  return this;
};

// 7. تجديد الاشتراك
schoolSchema.methods.renewSubscription = function(plan, amount, durationMonths = 12) {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + durationMonths);
  
  const planNames = {
      trial: 'تجريبي',
      basic: 'أساسي',
      standard: 'قياسي',
      premium: 'مميز',
      enterprise: 'مؤسسات'
  };
  
  const limits = this.getPlanLimits();
  
  this.subscription.plan = plan || this.subscription.plan || 'basic';
  this.subscription.planName = planNames[this.subscription.plan] || 'أساسي';
  this.subscription.startDate = now;
  this.subscription.endDate = endDate;
  this.subscription.status = 'active';
  this.subscription.amount = amount || this.subscription.amount || 0;
  this.subscription.paymentDate = now;
  this.subscription.invoiceNumber = `SUB-${Date.now().toString().slice(-8)}`;
  this.subscription.features = {
      maxStudents: limits.maxStudents,
      maxTeachers: limits.maxTeachers,
      maxClasses: limits.maxClasses,
      hasRFID: limits.hasRFID,
      hasSMS: limits.hasSMS,
      hasReports: limits.hasReports,
      hasAPI: limits.hasAPI
  };
  
  this.status = 'active';
  return this;
};

// 8. إضافة دفعة للاشتراك
schoolSchema.methods.addSubscriptionPayment = function(amount, method, notes = '') {
  if (!this.subscription.payments) {
      this.subscription.payments = [];
  }
  this.subscription.payments.push({
      amount: amount,
      date: new Date(),
      method: method || 'cash',
      receiptNumber: `PAY-${Date.now().toString().slice(-8)}`,
      notes: notes
  });
  this.subscription.amount = (this.subscription.amount || 0) + amount;
  return this;
};

// 9. الحصول على الميزات النشطة
schoolSchema.methods.getActiveFeatures = function() {
  if (!this.subscription || !this.subscription.features) {
      return {
          maxStudents: 10,
          maxTeachers: 3,
          maxClasses: 5,
          hasRFID: false,
          hasSMS: false,
          hasReports: false,
          hasAPI: false
      };
  }
  return this.subscription.features;
};

// 10. Middleware قبل الحفظ
schoolSchema.pre('save', function(next) {
  if (this.subscription && this.subscription.endDate) {
      this.updateStatusFromSubscription();
  }
  next();
});

// إنشاء النموذج - تأكد من وجود هذا السطر
const School = mongoose.model('School', schoolSchema);
// إنشاء النموذج (تأكد من عدم وجود تعريف مكرر)
    const StudentsAccountsSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      fullName: String,
      studentId : { type: String, required: true, unique: true },
      role: { type: String, enum: ['student'], required: true },
      createdAt: { type: Date, default: Date.now },
      active: { type: Boolean, default: true },
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' } // Add this line

    },{  strictPopulate: false 
    })
    const roundPaymentSchema = new mongoose.Schema({
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
      class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
      roundNumber: { type: String, required: true },
      sessionCount: { type: Number, required: true },
      sessionPrice: { type: Number, required: true },
      totalAmount: { type: Number, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
      recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      notes: String,
      sessions: [{
        sessionNumber: Number,
        date: Date,
        status: { type: String, enum: ['pending', 'completed', 'cancelled'], default: 'pending' },
        price: Number
      }]
    }, { timestamps: true });
    
    const RoundPayment = mongoose.model('RoundPayment', roundPaymentSchema);
    const studentSchema = new mongoose.Schema({
        username: { 
    type: String, 
    unique: true,
    sparse: true 
  },
  password: { 
    type: String 
  },
  studentAccountCreated: { 
    type: Boolean, 
    default: false 
  },

      
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },

      name: { type: String, required: true }, 
      studentId: { 
        type: String, 
        unique: true,
        default: function() {
          return 'STU-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        }
      },
      birthDate: Date,
      parentName: String,
      parentPhone: { type: String, required: true },
      parentEmail: { type: String, required: false },
      registrationDate: { type: Date, default: Date.now },
      active: { type: Boolean, default: true },
      academicYear: { 
        type: String, 
        enum: ['1AS', '2AS', '3AS', '1MS', '2MS', '3MS', '4MS', '5MS' ,'1AP','2AP','3AP','4AP','5AP','NS', null , 'اولى ابتدائي', 'ثانية ابتدائي', 'ثالثة ابتدائي', 'رابعة ابتدائي', 'خامسة ابتدائي', 'غير محدد'],
        required: true
      },
      new : { type: Boolean, default: true }, 
      classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
      status: { 
        type: String, 
        enum: ['pending', 'active', 'inactive', 'banned'], 
        default: 'pending'
      },
      // Add this field to track registration payment
      hasPaidRegistration: { 
        type: Boolean, 
        default: false 
      },
      registrationData: {
        address: String,
        previousSchool: String,
        healthInfo: String,
        documents: [{
          name: String,
          url: String,
          verified: { type: Boolean, default: false }
        }]
      }
    }, { strictPopulate: false });

// في server.js
const teacherSchema = new mongoose.Schema({
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School', 
    required: true,
    index: true 
  },
  name: { type: String, required: true },
  subjects: { 
    type: [String], 
    enum: [
      'رياضيات', 'فيزياء', 'كيمياء', 'علوم طبيعية',
      'لغة عربية', 'لغة فرنسية', 'لغة انجليزية',
      'تاريخ', 'جغرافيا', 'فلسفة', 'إعلام آلي',
      'تربية بدنية', 'تربية فنية', 'تربية موسيقية',
      'كيمياء', 'بيولوجيا', 'علوم الأرض',
      'تربية إسلامية', 'تربية مدنية', "تسيير و اقتصاد",
      'لغة أمازيغية', 'لغة تركية', 'لغة ألمانية'
    ],
    default: [] 
  },
  phone: { type: String },
  email: { type: String },
  hireDate: { type: Date, default: Date.now },
  active: { type: Boolean, default: true },
  salaryPercentage: { type: Number, default: 0.7 }
}, { timestamps: true });

// models/Classroom.js - النسخة المحدثة
// models/Classroom.js - تأكد من وجود حقل status
// ==============================================
// نموذج Classroom - النسخة المحدثة مع schoolId
// ==============================================
const classroomSchema = new mongoose.Schema({
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School', 
    required: true,
    index: true
  },
  name: { type: String, required: true, trim: true },
  capacity: { type: Number, required: true, min: 1, default: 30 },
  floor: { type: Number, required: true, min: 0, default: 1 },
  building: { type: String, required: true, trim: true, default: 'المبنى الرئيسي' },
  location: { type: String, trim: true, default: '' },
  color: { type: String, default: '#4361ee', match: [/^#[0-9a-fA-F]{6}$/, 'لون غير صحيح'] },
  equipment: { type: [String], default: [] },
  status: { 
    type: String, 
    enum: ['available', 'occupied', 'maintenance'],
    default: 'available'
  },
  description: { type: String, trim: true, default: '' },
  floorArea: { type: Number, min: 0, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// فهارس لتحسين أداء البحث
classroomSchema.index({ schoolId: 1, building: 1, floor: 1, name: 1 });
classroomSchema.index({ schoolId: 1, status: 1 });
classroomSchema.index({ schoolId: 1, location: 1 });

// Middleware لتحديث updatedAt قبل الحفظ
classroomSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// دالة مساعدة للحصول على قائمة التجهيزات كـ String
classroomSchema.methods.getEquipmentList = function() {
  if (!this.equipment || this.equipment.length === 0) return 'لا توجد تجهيزات';
  return this.equipment.join('، ');
};

// دالة مساعدة للتحقق من توفر تجهيز معين
classroomSchema.methods.hasEquipment = function(item) {
  if (!this.equipment) return false;
  return this.equipment.some(eq => eq.toLowerCase().includes(item.toLowerCase()));
};


  // في قسم classSchema، أضف الحقل التالي:
  // في قسم classSchema، أضف الحقول التالية:
  const classSchema = new mongoose.Schema({
      schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },

    name: { type: String, required: true },
  subject: { 
    type: String, 
    enum: ['رياضيات', 'فيزياء', 'علوم', 'لغة عربية', 'لغة فرنسية', 'لغة انجليزية', 'تاريخ', 'جغرافيا', 'فلسفة', 'إعلام آلي'] 
  },
    description: String,
    schedule: [{
      day: { type: String, enum: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'] },
      time: String,
      classroom: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom' }
    }],
    academicYear: { type: String, enum: ['1AS', '2AS', '3AS', '1MS', '2MS', '3MS', '4MS', '5MS','1AP','2AP','3AP','4AP','5AP','NS'] },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
    price: { type: Number, required: true },
    
    // حقل جديد لنظام الدفع
    paymentSystem: {
      type: String,
      enum: ['monthly', 'rounds'], // شهري أو جولات
      default: 'monthly'
    },
    
    // إعدادات إضافية لنظام الجولات
    roundSettings: {
      sessionCount: { type: Number, default: 8 }, // عدد الجلسات في الجولة
      sessionDuration: { type: Number, default: 2 }, // مدة الجلسة بالساعات
      breakBetweenSessions: { type: Number, default: 0 } // استراحة بين الجلسات بالأيام
    }
  }, { timestamps: true });


    const attendanceSchema = new mongoose.Schema({
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
      class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
      date: { type: Date, required: true },
      status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
      recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    });

const cardSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true }, // إضافة هذا الحقل
  issueDate: { type: Date, default: Date.now }
});
    // Add this schema near your other schemas
    const authorizedCardSchema = new mongoose.Schema({
      uid: { 
        type: String, 
        required: true, 
        unique: true,
        index: true 
      },
      cardName: { 
        type: String, 
        required: true 
      },
      description: String,
      issueDate: { 
        type: Date, 
        default: Date.now 
      },
      expirationDate: { 
        type: Date, 
        required: true 
      },
      active: { 
        type: Boolean, 
        default: true 
      },
      createdBy: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: false , 
      },
      notes: String
    }, { timestamps: true });


    // في paymentSchema، أضف حقل العمولة
// Payment Schema - النسخة المحدثة مع دعم العمولات
const paymentSchema = new mongoose.Schema({
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School', 
    required: true,
    index: true 
  },
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true,
    index: true 
  },
  class: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class',
    index: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  month: { 
    type: String, 
    required: true 
  },
  monthCode: { 
    type: String, 
    required: false,
    index: true 
  },
  paymentDate: { 
    type: Date, 
    default: null 
  },
  status: { 
    type: String, 
    enum: ['paid', 'pending', 'late', 'cancelled'], 
    default: 'pending',
    index: true 
  },
  paymentMethod: { 
    type: String, 
    enum: ['cash', 'bank', 'online'], 
    default: 'cash' 
  },
  invoiceNumber: { 
    type: String 
  },
  recordedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  // ==============================================
  // 🔥 حقول جديدة لدعم العمولات
  // ==============================================
  commissionRecorded: { 
    type: Boolean, 
    default: false 
  },
  commissionId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'TeacherCommission',
    index: true 
  },
  notes: { 
    type: String, 
    required: false 
  }
}, { 
  timestamps: true 
});

// فهارس إضافية
paymentSchema.index({ student: 1, monthCode: 1 });
paymentSchema.index({ class: 1, monthCode: 1 });
paymentSchema.index({ commissionId: 1, status: 1 });

    const messageSchema = new mongoose.Schema({
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      recipients: [{
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
        parentPhone: String,
        parentEmail: String
      }],
      class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
      content: { type: String, required: true },
      sentAt: { type: Date, default: Date.now },
      messageType: { type: String, enum: ['individual', 'group', 'class', 'payment'] },
      status: { type: String, enum: ['sent', 'failed'], default: 'sent' }
    });
// ==============================================
// نموذج FinancialTransaction - مع إضافة refund
// ==============================================
const financialTransactionSchema = new mongoose.Schema({
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School', 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['income', 'expense', 'refund', 'adjustment'], // ✅ أضفنا refund هنا
    required: false
  },
  amount: { 
    type: Number, 
    required: true 
  },
  description: String,
  category: { 
    type: String, 
    enum: ['tuition', 'salary', 'rent', 'utilities', 'supplies', 'other', 'registration', 'refund','refunded'],
    required: false 
  },
  date: { 
    type: Date, 
    default: Date.now 
  },
  recordedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  reference: String,
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Student' 
  }
});
    // Add this near other schemas
// ==============================================
// LIVE CLASS SCHEMA - Updated with schoolId
// ==============================================
const liveClassSchema = new mongoose.Schema({
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School', 
    required: true,
    index: true // ✅ Index for faster queries
  },
  class: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true 
  },
  month: { 
    type: String, 
    default: function() {
      if (this.date) {
        const d = new Date(this.date);
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      }
      return new Date().toISOString().slice(0, 7);
    }, 
    required: true 
  },
  startTime: { 
    type: String, 
    required: true 
  },
  endTime: { 
    type: String 
  },
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Teacher', 
    required: true 
  },
  classroom: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Classroom' 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'ongoing', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  attendance: [{
    student: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Student', 
      required: true 
    },
    status: { 
      type: String, 
      enum: ['present', 'absent', 'late'], 
      default: 'present' 
    },
    joinedAt: { type: Date },
    leftAt: { type: Date },
    timestamp: { type: Date, default: Date.now },
    method: { 
      type: String, 
      enum: ['manual', 'rfid', 'auto', 'bulk'], 
      default: 'manual' 
    },
    attendanceSchemaId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Attendance' 
    }
  }],
  notes: { type: String },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { 
  timestamps: true 
});

// ==============================================
// ✅ Indexes for better performance
// ==============================================
liveClassSchema.index({ schoolId: 1, date: 1, status: 1 });
liveClassSchema.index({ schoolId: 1, class: 1, month: 1 });
liveClassSchema.index({ schoolId: 1, teacher: 1, date: 1 });
liveClassSchema.index({ schoolId: 1, classroom: 1, date: 1 });
liveClassSchema.index({ schoolId: 1, status: 1, date: -1 });

// ==============================================
// ✅ Middleware to auto-set month before save
// ==============================================
liveClassSchema.pre('save', function(next) {
  if (this.date) {
    const date = new Date(this.date);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    this.month = `${year}-${month}`;
  }
  next();
});

// ==============================================
// ✅ Static methods for filtering by school
// ==============================================
liveClassSchema.statics.findBySchool = function(schoolId, options = {}) {
  const query = { schoolId: schoolId };
  if (options.status) query.status = options.status;
  if (options.classId) query.class = options.classId;
  if (options.date) {
    const startDate = new Date(options.date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    query.date = { $gte: startDate, $lt: endDate };
  }
  if (options.month) query.month = options.month;
  if (options.teacher) query.teacher = options.teacher;
  
  return this.find(query)
    .populate('class', 'name subject price')
    .populate('teacher', 'name phone email')
    .populate('classroom', 'name location status')
    .populate('attendance.student', 'name studentId')
    .sort(options.sort || { date: -1, startTime: -1 })
    .limit(options.limit || 100);
};

// ==============================================
// ✅ Instance method to check if classroom is available
// ==============================================
liveClassSchema.methods.isClassroomAvailable = async function() {
  if (!this.classroom) return true;
  
  const existing = await this.constructor.findOne({
    schoolId: this.schoolId,
    classroom: this.classroom,
    date: this.date,
    startTime: this.startTime,
    status: { $in: ['scheduled', 'ongoing'] },
    _id: { $ne: this._id }
  });
  
  return !existing;
};

  // دالة لتحديث حقل الشهر تلقائياً قبل حفظ LiveClass
  liveClassSchema.pre('save', function(next) {
    if (this.date) {
      const date = new Date(this.date);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      this.month = `${year}-${month}`;
    }
    next();
  });


    // Add these schemas near your other schemas

    // School Fee Schema (one-time registration fee)
    const schoolFeeSchema = new mongoose.Schema({
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    amount: { type: Number, required: true, default: 600 }, // 60 DZD
    paymentDate: { type: Date, default: null },
    status: { type: String, enum: ['paid', 'pending'], default: 'pending' },
    paymentMethod: { type: String, enum: ['cash', 'bank', 'online'], default: 'cash' },
    invoiceNumber: String,
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    });

    // Teacher Payment Schema (monthly payments)
    const teacherPaymentSchema = new mongoose.Schema({
      teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
      class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
      month: { type: String, required: true }, // Format: YYYY-MM
      amount: { type: Number, required: true }, // 70% of class price
      status: { type: String, enum: ['paid', 'pending', 'late'], default: 'pending' },
      paymentDate: { type: Date, default: null },
      paymentMethod: { type: String, enum: ['cash', 'bank', 'online'], default: 'cash' },
      invoiceNumber: String,
      recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    });

    // Staff Salary Schema
    const staffSalarySchema = new mongoose.Schema({
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true }, // Format: YYYY-MM
    amount: { type: Number, required: true },
    status: { type: String, enum: ['paid', 'pending', 'late'], default: 'pending' },
    paymentDate: { type: Date, default: null },
    paymentMethod: { type: String, enum: ['cash', 'bank', 'online'], default: 'cash' },
    notes: String,
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    });

    // Expense Schema
    // Budget Schema
    const budgetSchema = new mongoose.Schema({
      title: { type: String, required: true },
      amount: { type: Number, required: true },
      category: { 
        type: String, 
        enum: ['operational', 'salaries', 'development', 'marketing', 'other'],
        required: true 
      },
      description: String,
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      actualSpending: { type: Number, default: 0 },
      remainingBudget: { type: Number, default: function() { return this.amount; } }
    }, { timestamps: true });


    // Expense Schema (محدث)
    const expenseSchema = new mongoose.Schema({
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
      description: { type: String, required: true },
      amount: { type: Number, required: true },
      category: { 
        type: String, 
        enum: ['salary', 'rent', 'utilities', 'supplies', 'maintenance', 'marketing', 'other'],
        required: true 
      },
      type: { 
        type: String, 
        enum: ['teacher_payment', 'staff_salary', 'operational'],
        default: 'operational' // Add default value
      },
      date: { type: Date, default: Date.now },
      paymentMethod: { type: String, enum: ['cash', 'bank', 'online'], default: 'cash' },
      receiptNumber: String,
      status: { type: String, enum: ['pending', 'paid'], default: 'pending' },
      recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    });

// Teacher Commission Schema
// Teacher Commission Schema - النسخة النهائية المُصححة (احتفظ بهذا فقط)
const teacherCommissionSchema = new mongoose.Schema({
  // ==============================================
  // المعلومات الأساسية
  // ==============================================
  schoolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'School', 
    required: true,
    index: true 
  },
  teacher: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Teacher', 
    required: true,
    index: true 
  },
  class: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Class', 
    required: true,
    index: true 
  },
  
  // ==============================================
  // معلومات الشهر والجولة
  // ==============================================
  month: { 
    type: String, 
    required: true, 
    index: true // Format: 'YYYY-MM'
  },
  round: { 
    type: String, 
    required: false // For periodic rounds
  },
  
  // ==============================================
  // المعلومات المالية
  // ==============================================
  totalAmount: { 
    type: Number, 
    required: true, 
    default: 0 
  },
  percentage: { 
    type: Number, 
    required: true, 
    default: 70 
  },
  status: { 
    type: String, 
    enum: ['pending', 'partial', 'paid', 'cancelled'], 
    default: 'pending',
    index: true 
  },
  totalPaid: { 
    type: Number, 
    default: 0 
  },
  remainingAmount: { 
    type: Number, 
    default: 0 
  },
  
  // ==============================================
  // تفاصيل الطلاب في هذه العمولة
  // ==============================================
  students: [{
    student: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Student', 
      required: true 
    },
    studentName: { 
      type: String 
    },
    attendancesCount: { 
      type: Number, 
      default: 0 
    },
    teacherShare: { 
      type: Number, 
      required: true // Individual student's commission
    },
    status: { 
      type: String, 
      enum: ['pending', 'paid', 'cancelled'], 
      default: 'pending' 
    },
    paymentDate: { 
      type: Date, 
      default: null 
    },
    paymentMethod: { 
      type: String, 
      enum: ['cash', 'bank', 'online'], 
      default: 'cash' 
    },
    receiptNumber: { 
      type: String 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  }],
  
  // ==============================================
  // سجل المدفوعات
  // ==============================================
  paymentHistory: [{
    student: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Student' 
    },
    amount: { 
      type: Number, 
      required: true 
    },
    paymentDate: { 
      type: Date, 
      default: Date.now 
    },
    paymentMethod: { 
      type: String, 
      enum: ['cash', 'bank', 'online'], 
      default: 'cash' 
    },
    receiptNumber: { 
      type: String 
    },
    round: { 
      type: String 
    },
    month: { 
      type: String 
    },
    recordedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    notes: { 
      type: String 
    }
  }],
  
  // ==============================================
  // معلومات إضافية
  // ==============================================
  recordedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  notes: { 
    type: String, 
    required: false 
  }
}, { 
  timestamps: true 
});

// ==============================================
// الفهارس (Indexes) لتحسين الأداء
// ==============================================
// ⚠️ قم بإزالة indexes المكررة - احتفظ بواحدة فقط
teacherCommissionSchema.index({ schoolId: 1, teacher: 1, month: 1, class: 1 });
teacherCommissionSchema.index({ schoolId: 1, teacher: 1, status: 1 });
teacherCommissionSchema.index({ schoolId: 1, month: 1, status: 1 });
teacherCommissionSchema.index({ teacher: 1, month: 1 });

// ==============================================
// دوال مساعدة (Methods)
// ==============================================

// 1. حساب المبلغ المتبقي
teacherCommissionSchema.methods.calculateRemaining = function() {
  this.remainingAmount = this.totalAmount - this.totalPaid;
  return this.remainingAmount;
};

// 2. تحديث الحالة تلقائياً
teacherCommissionSchema.methods.updateStatus = function() {
  if (this.status === 'cancelled') return;
  
  if (this.totalPaid >= this.totalAmount) {
    this.status = 'paid';
  } else if (this.totalPaid > 0) {
    this.status = 'partial';
  } else {
    this.status = 'pending';
  }
  return this.status;
};

// 3. إضافة دفعة جديدة
teacherCommissionSchema.methods.addPayment = function(studentId, amount, paymentMethod, receiptNumber, recordedBy) {
  this.paymentHistory.push({
    student: studentId,
    amount: amount,
    paymentDate: new Date(),
    paymentMethod: paymentMethod || 'cash',
    receiptNumber: receiptNumber || `PAY-${Date.now()}`,
    recordedBy: recordedBy
  });
  
  this.totalPaid += amount;
  this.calculateRemaining();
  this.updateStatus();
  
  return this;
};

// 4. تحديث حالة طالب معين
teacherCommissionSchema.methods.updateStudentStatus = function(studentId, status, paymentData = {}) {
  const studentIndex = this.students.findIndex(
    s => s.student.toString() === studentId.toString()
  );
  
  if (studentIndex === -1) return null;
  
  this.students[studentIndex].status = status;
  
  if (status === 'paid') {
    this.students[studentIndex].paymentDate = paymentData.paymentDate || new Date();
    this.students[studentIndex].paymentMethod = paymentData.paymentMethod || 'cash';
    this.students[studentIndex].receiptNumber = paymentData.receiptNumber || `REC-${Date.now()}`;
  }
  
  return this.students[studentIndex];
};

// 5. حساب إجمالي العمولة للطالب
teacherCommissionSchema.methods.getStudentTotal = function(studentId) {
  const student = this.students.find(
    s => s.student.toString() === studentId.toString()
  );
  return student ? student.teacherShare : 0;
};

// 6. الحصول على عدد الطلاب النشطين
teacherCommissionSchema.methods.getActiveStudentsCount = function() {
  return this.students.filter(s => s.isActive !== false).length;
};

// 7. الحصول على عدد الطلاب المدفوعين
teacherCommissionSchema.methods.getPaidStudentsCount = function() {
  return this.students.filter(s => s.status === 'paid').length;
};

// ==============================================
// دوال ثابتة (Statics) - مُصححة
// ==============================================

// 1. البحث عن عمولات أستاذ معين
teacherCommissionSchema.statics.findByTeacher = function(teacherId, options = {}) {
  const query = { teacher: teacherId };
  if (options.month) query.month = options.month;
  if (options.status) query.status = options.status;
  if (options.schoolId) query.schoolId = options.schoolId;
  
  return this.find(query)
    .populate('class', 'name subject price')
    .populate('students.student', 'name studentId')
    .sort(options.sort || { month: -1 });
};

// 2. البحث عن عمولات شهر معين
teacherCommissionSchema.statics.findByMonth = function(month, options = {}) {
  const query = { month: month };
  if (options.schoolId) query.schoolId = options.schoolId;
  if (options.status) query.status = options.status;
  if (options.teacher) query.teacher = options.teacher;
  
  return this.find(query)
    .populate('teacher', 'name phone email')
    .populate('class', 'name subject price')
    .populate('students.student', 'name studentId');
};

// 3. الحصول على إحصائيات العمولات
teacherCommissionSchema.statics.getStats = async function(filters = {}) {
  const matchStage = {};
  if (filters.schoolId) matchStage.schoolId = filters.schoolId;
  if (filters.teacher) matchStage.teacher = filters.teacher;
  if (filters.month) matchStage.month = filters.month;
  if (filters.status) matchStage.status = filters.status;
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$totalPaid' },
        totalRemaining: { $sum: '$remainingAmount' },
        count: { $sum: 1 },
        studentsCount: { $sum: { $size: '$students' } }
      }
    }
  ]);
  
  const result = {
    pending: { amount: 0, paid: 0, remaining: 0, count: 0, students: 0 },
    partial: { amount: 0, paid: 0, remaining: 0, count: 0, students: 0 },
    paid: { amount: 0, paid: 0, remaining: 0, count: 0, students: 0 },
    cancelled: { amount: 0, paid: 0, remaining: 0, count: 0, students: 0 }
  };
  
  stats.forEach(stat => {
    if (stat._id && result[stat._id]) {
      result[stat._id] = {
        amount: stat.totalAmount || 0,
        paid: stat.totalPaid || 0,
        remaining: stat.totalRemaining || 0,
        count: stat.count || 0,
        students: stat.studentsCount || 0
      };
    }
  });
  
  return result;
};

// 4. الحصول على ملخص شهري - مُصحح
teacherCommissionSchema.statics.getMonthlySummary = async function(schoolId, year) {
  const matchStage = { schoolId: schoolId };
  if (year) matchStage.month = { $regex: `^${year}` };
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$month',
        totalAmount: { $sum: '$totalAmount' },
        totalPaid: { $sum: '$totalPaid' },
        totalRemaining: { $sum: '$remainingAmount' },
        count: { $sum: 1 },
        teachers: { $addToSet: '$teacher' },
        students: { $sum: { $size: '$students' } }
      }
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        month: '$_id',
        totalAmount: 1,
        totalPaid: 1,
        totalRemaining: 1,
        count: 1,
        teachersCount: { $size: '$teachers' },
        studentsCount: '$students'
      }
    }
  ]);
};

// ==============================================
// Middleware - قبل الحفظ
// ==============================================
teacherCommissionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // حساب المبلغ المتبقي تلقائياً
  this.remainingAmount = this.totalAmount - this.totalPaid;
  
  // تحديث الحالة تلقائياً
  if (this.status !== 'cancelled') {
    if (this.totalPaid >= this.totalAmount) {
      this.status = 'paid';
    } else if (this.totalPaid > 0) {
      this.status = 'partial';
    } else {
      this.status = 'pending';
    }
  }
  
  next();
});

// ==============================================
// إنشاء النموذج - تأكد من وجود هذا السطر مرة واحدة فقط
// ==============================================
// Create the model
    // Create models
    const Budget = mongoose.model('Budget', budgetSchema);
    const TeacherCommission = mongoose.model('TeacherCommission', teacherCommissionSchema);
    // Invoice Schema
    const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true, unique: true },
    type: { 
      type: String, 
      enum: ['tuition', 'teacher', 'staff', 'school-fee', 'other'],
      required: true 
    },
    recipient: {
      type: { type: String, enum: ['student', 'teacher', 'staff', 'other'] },
      id: mongoose.Schema.Types.ObjectId, // Could be Student, Teacher, or User ID
      name: String
    },
    items: [{
      description: String,
      amount: Number,
      quantity: { type: Number, default: 1 }
    }],
    totalAmount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    dueDate: Date,
    status: { type: String, enum: ['paid', 'pending', 'overdue'], default: 'pending' },
    paymentMethod: { type: String, enum: ['cash', 'bank', 'online'], default: 'cash' },
    notes: String,
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    });

    // Create models
    const SchoolFee = mongoose.model('SchoolFee', schoolFeeSchema);
    const TeacherPayment = mongoose.model('TeacherPayment', teacherPaymentSchema);
    const StaffSalary = mongoose.model('StaffSalary', staffSalarySchema);
    const Expense = mongoose.model('Expense', expenseSchema);
    const Invoice = mongoose.model('Invoice', invoiceSchema);
    const AuthorizedCard = mongoose.model('AuthorizedCard', authorizedCardSchema);













    const LiveClass = mongoose.model('LiveClass', liveClassSchema);

    const User = mongoose.model('User', userSchema);
    const Student = mongoose.model('Student', studentSchema);
    const Teacher = mongoose.model('Teacher', teacherSchema);
    const Classroom = mongoose.model('Classroom', classroomSchema);
    const Class = mongoose.model('Class', classSchema);
    const Attendance = mongoose.model('Attendance', attendanceSchema);
    const Card = mongoose.model('Card', cardSchema);
    const Payment = mongoose.model('Payment', paymentSchema);
    const Message = mongoose.model('Message', messageSchema);
    const FinancialTransaction = mongoose.model('FinancialTransaction', financialTransactionSchema);
    const StudentAccount = mongoose.model('StudentAccount', StudentsAccountsSchema);
    // RFID Reader Implementation


    //create new scholl
// ==============================================
// Routes لإدارة المدارس - Redox Admin
// ==============================================

// ==============================================
// Routes لإدارة المدارس - Redox Admin
// ==============================================

// ==============================================
// Routes لإدارة المدارس - Redox Admin
// ==============================================

// 1. إنشاء مدرسة جديدة
// ==============================================
// Routes لإدارة المدارس المُحدّثة
// ==============================================

// 1. إنشاء مدرسة جديدة مع مدير
// ==============================================
// 1. إنشاء مدرسة جديدة مع مدير - FIXED ✅
// ==============================================

app.post('/api/redox-admin/school', async (req, res) => {
  try {
    console.log('📝 استلام طلب إنشاء مدرسة:', req.body);
    
    const { 
      name, 
      email, 
      phone, 
      address, 
      key,
      adminUsername,
      adminPassword,
      adminFullName,
      adminEmail,
      adminPhone,
      plan = 'trial',
      subscriptionDuration = 1,
      subscriptionAmount = 0
    } = req.body;
    
    // ✅ التحقق من البيانات المطلوبة
    if (!name || !email || !phone || !key) {
      return res.status(400).json({ 
        error: 'جميع الحقول مطلوبة: name, email, phone, key',
        status: 'error' 
      });
    }

    // ✅ التحقق من وجود المدرسة مسبقاً
    const existingSchool = await School.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { email: { $regex: new RegExp(`^${email}$`, 'i') } },
        { schoolKey: key }
      ]
    });

    if (existingSchool) {
      return res.status(400).json({ 
        error: 'المدرسة موجودة مسبقاً',
        status: 'error' 
      });
    }

    // ✅ تشفير كلمة مرور المدير
    const hashedPassword = adminPassword ? await bcrypt.hash(adminPassword, 10) : null;

    // ✅ حساب تاريخ انتهاء الاشتراك
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + subscriptionDuration);

    // ✅ تحديد الميزات حسب الخطة
    const planFeatures = {
      trial: { maxStudents: 10, maxTeachers: 3, maxClasses: 5, hasRFID: false, hasSMS: false, hasReports: false, hasAPI: false },
      basic: { maxStudents: 50, maxTeachers: 10, maxClasses: 20, hasRFID: false, hasSMS: false, hasReports: true, hasAPI: false },
      standard: { maxStudents: 150, maxTeachers: 25, maxClasses: 50, hasRFID: true, hasSMS: false, hasReports: true, hasAPI: false },
      premium: { maxStudents: 500, maxTeachers: 50, maxClasses: 100, hasRFID: true, hasSMS: true, hasReports: true, hasAPI: true },
      enterprise: { maxStudents: 9999, maxTeachers: 999, maxClasses: 999, hasRFID: true, hasSMS: true, hasReports: true, hasAPI: true }
    };

    const planNames = {
      trial: 'تجريبي',
      basic: 'أساسي',
      standard: 'قياسي',
      premium: 'مميز',
      enterprise: 'مؤسسات'
    };

    const features = planFeatures[plan] || planFeatures.trial;

    // ✅ إنشاء المدرسة الجديدة
    const newSchool = new School({
      name,
      email,
      phone,
      address: address || '',
      schoolKey: key,
      status: 'active',
      subscription: {
        plan: plan || 'trial',
        planName: planNames[plan] || 'تجريبي',
        startDate: now,
        endDate: endDate,
        amount: subscriptionAmount || 0,
        status: 'active',
        paymentMethod: 'free',
        paymentDate: now,
        invoiceNumber: `SUB-${Date.now().toString().slice(-8)}`,
        features: features,
        payments: subscriptionAmount > 0 ? [{
          amount: subscriptionAmount,
          date: now,
          method: 'free',
          receiptNumber: `PAY-${Date.now().toString().slice(-8)}`,
          notes: 'دفعة أولية'
        }] : []
      },
      admins: [{
        username: adminUsername || 'admin',
        password: hashedPassword || await bcrypt.hash('admin123', 10),
        fullName: adminFullName || 'مدير المدرسة',
        email: adminEmail || email,
        phone: adminPhone || phone,
        role: 'super_admin',
        isActive: true,
        permissions: {
          canManageStudents: true,
          canManageTeachers: true,
          canManageClasses: true,
          canManagePayments: true,
          canManageUsers: true,
          canViewReports: true,
          canManageSubscription: true
        }
      }]
    });

    // ✅ حفظ المدرسة في قاعدة البيانات
    await newSchool.save();
    console.log('✅ تم إنشاء المدرسة:', newSchool.name);

    // ✅ استخراج المدير من المدرسة التي تم إنشاؤها
    const admin = newSchool.admins[0];

    // ✅ إنشاء التوكن - 🔥 FIXED: استخدام newSchool بدلاً من school
    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        schoolId: newSchool._id,        // ✅ تم التصحيح: newSchool._id
        schoolKey: newSchool.schoolKey, // ✅ تم التصحيح: newSchool.schoolKey
        permissions: admin.permissions
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );

    // ✅ إرجاع الاستجابة الناجحة
    res.status(201).json({ 
      message: '✅ تم إنشاء المدرسة بنجاح', 
      school: {
        _id: newSchool._id,
        name: newSchool.name,
        email: newSchool.email,
        phone: newSchool.phone,
        schoolKey: newSchool.schoolKey,
        subscription: {
          plan: newSchool.subscription.plan,
          planName: newSchool.subscription.planName,
          startDate: newSchool.subscription.startDate,
          endDate: newSchool.subscription.endDate,
          daysRemaining: newSchool.getSubscriptionDaysRemaining ? newSchool.getSubscriptionDaysRemaining() : 0,
          isActive: newSchool.isSubscriptionActive ? newSchool.isSubscriptionActive() : true
        }
      },
      admin: {
        id: admin._id,
        username: admin.username,
        fullName: admin.fullName,
        role: admin.role
      },
      token: token,
      status: 'success' 
    });

  } catch (error) {
    console.error('❌ خطأ في إنشاء المدرسة:', error);
    res.status(500).json({ 
      error: 'فشل في إنشاء المدرسة: ' + error.message,
      status: 'error' 
    });
  }
});

// 2. الحصول على جميع المدارس مع معلومات الاشتراك
app.get('/api/redox-admin/schools', async (req, res) => {
  try {
      console.log('📤 جلب جميع المدارس...');
      
      const schools = await School.find()
          .select('-__v -admins.password')
          .sort({ createdAt: -1 });

      // إضافة معلومات إضافية لكل مدرسة
      const enhancedSchools = schools.map(school => {
          const schoolObj = school.toObject();
          schoolObj.subscription = {
              ...schoolObj.subscription,
              daysRemaining: school.getSubscriptionDaysRemaining(),
              isActive: school.isSubscriptionActive(),
              isExpired: school.isSubscriptionExpired(),
              planLimits: school.getPlanLimits()
          };
          schoolObj.adminsCount = school.admins?.length || 0;
          return schoolObj;
      });

      console.log(`✅ تم جلب ${enhancedSchools.length} مدرسة`);

      res.json({ 
          schools: enhancedSchools, 
          status: 'success',
          count: enhancedSchools.length 
      });
  } catch (error) {
      console.error('❌ خطأ في جلب المدارس:', error);
      res.status(500).json({ 
          error: 'فشل في جلب المدارس: ' + error.message,
          status: 'error' 
      });
  }
});

// 3. الحصول على مدرسة محددة مع جميع التفاصيل
app.get('/api/redox-admin/school/:id', async (req, res) => {
  try {
      const school = await School.findById(req.params.id)
          .select('-__v -admins.password');
      
      if (!school) {
          return res.status(404).json({ 
              error: 'المدرسة غير موجودة',
              status: 'error' 
          });
      }

      const schoolObj = school.toObject();
      schoolObj.subscription = {
          ...schoolObj.subscription,
          daysRemaining: school.getSubscriptionDaysRemaining(),
          isActive: school.isSubscriptionActive(),
          isExpired: school.isSubscriptionExpired(),
          planLimits: school.getPlanLimits()
      };

      res.json({ 
          school: schoolObj, 
          status: 'success' 
      });
  } catch (error) {
      res.status(500).json({ 
          error: 'فشل في جلب المدرسة: ' + error.message,
          status: 'error' 
      });
  }
});

// 4. تحديث المدرسة
app.put('/api/redox-admin/school/:id', async (req, res) => {
  try {
      const { name, address, phone, email, status } = req.body;
      const updateData = { name, address, phone, email, status };

      // منع تحديث الحقول الحساسة
      delete updateData.schoolKey;
      delete updateData.admins;
      delete updateData.subscription;

      const school = await School.findByIdAndUpdate(
          req.params.id,
          { $set: updateData },
          { new: true, runValidators: true }
      ).select('-__v -admins.password');

      if (!school) {
          return res.status(404).json({ 
              error: 'المدرسة غير موجودة',
              status: 'error' 
          });
      }

      res.json({ 
          message: '✅ تم تحديث المدرسة بنجاح', 
          school,
          status: 'success' 
      });
  } catch (error) {
      res.status(500).json({ 
          error: 'فشل في تحديث المدرسة: ' + error.message,
          status: 'error' 
      });
  }
});

// 5. إضافة مدير للمدرسة
app.post('/api/redox-admin/school/:id/admin', async (req, res) => {
  try {
      const { username, password, fullName, email, phone, permissions } = req.body;

      if (!username || !password || !fullName) {
          return res.status(400).json({
              error: 'البيانات ناقصة: username, password, fullName مطلوبة',
              status: 'error'
          });
      }

      const school = await School.findById(req.params.id);
      if (!school) {
          return res.status(404).json({
              error: 'المدرسة غير موجودة',
              status: 'error'
          });
      }

      // التحقق من عدم وجود اسم مستخدم مكرر
      const existingAdmin = school.admins.find(a => a.username === username);
      if (existingAdmin) {
          return res.status(400).json({
              error: 'اسم المستخدم موجود مسبقاً',
              status: 'error'
          });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      school.admins.push({
          username,
          password: hashedPassword,
          fullName,
          email: email || school.email,
          phone: phone || school.phone,
          role: 'admin',
          isActive: true,
          permissions: permissions || {
              canManageStudents: true,
              canManageTeachers: true,
              canManageClasses: true,
              canManagePayments: true,
              canManageUsers: false,
              canViewReports: true,
              canManageSubscription: false
          }
      });

      await school.save();

      const newAdmin = school.admins[school.admins.length - 1];
      
      // إنشاء توكن للمدير الجديد
// في نقطة /api/auth/login
const token = jwt.sign(
    {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        schoolId: school._id, // ✅ تم إضافة schoolId هنا
        schoolKey: school.schoolKey,
        permissions: admin.permissions
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '8h' }
);

      res.status(201).json({
          message: '✅ تم إضافة المدير بنجاح',
          admin: {
              _id: newAdmin._id,
              username: newAdmin.username,
              fullName: newAdmin.fullName,
              role: newAdmin.role,
              email: newAdmin.email,
              phone: newAdmin.phone
          },
          token,
          status: 'success'
      });
  } catch (error) {
      console.error('❌ خطأ في إضافة المدير:', error);
      res.status(500).json({
          error: 'فشل في إضافة المدير: ' + error.message,
          status: 'error'
      });
  }
});

// 6. الحصول على مدراء المدرسة
app.get('/api/redox-admin/school/:id/admins', async (req, res) => {
  try {
      const school = await School.findById(req.params.id)
          .select('admins name');
      
      if (!school) {
          return res.status(404).json({
              error: 'المدرسة غير موجودة',
              status: 'error'
          });
      }

      const admins = school.admins.map(admin => ({
          _id: admin._id,
          username: admin.username,
          fullName: admin.fullName,
          email: admin.email,
          phone: admin.phone,
          role: admin.role,
          isActive: admin.isActive,
          lastLogin: admin.lastLogin,
          permissions: admin.permissions
      }));

      res.json({
          admins,
          schoolName: school.name,
          count: admins.length,
          status: 'success'
      });
  } catch (error) {
      res.status(500).json({
          error: 'فشل في جلب المدراء: ' + error.message,
          status: 'error'
      });
  }
});

// 7. تحديث مدير
app.put('/api/redox-admin/school/:schoolId/admin/:adminId', async (req, res) => {
  try {
      const { fullName, email, phone, isActive, permissions, password } = req.body;

      const school = await School.findById(req.params.schoolId);
      if (!school) {
          return res.status(404).json({
              error: 'المدرسة غير موجودة',
              status: 'error'
          });
      }

      const adminIndex = school.admins.findIndex(
          a => a._id.toString() === req.params.adminId
      );

      if (adminIndex === -1) {
          return res.status(404).json({
              error: 'المدير غير موجود',
              status: 'error'
          });
      }

      // تحديث البيانات
      if (fullName) school.admins[adminIndex].fullName = fullName;
      if (email) school.admins[adminIndex].email = email;
      if (phone) school.admins[adminIndex].phone = phone;
      if (isActive !== undefined) school.admins[adminIndex].isActive = isActive;
      if (permissions) school.admins[adminIndex].permissions = permissions;
      if (password) {
          school.admins[adminIndex].password = await bcrypt.hash(password, 10);
      }

      await school.save();

      const updatedAdmin = school.admins[adminIndex];
      
      res.json({
          message: '✅ تم تحديث المدير بنجاح',
          admin: {
              _id: updatedAdmin._id,
              username: updatedAdmin.username,
              fullName: updatedAdmin.fullName,
              email: updatedAdmin.email,
              phone: updatedAdmin.phone,
              role: updatedAdmin.role,
              isActive: updatedAdmin.isActive,
              permissions: updatedAdmin.permissions
          },
          status: 'success'
      });
  } catch (error) {
      console.error('❌ خطأ في تحديث المدير:', error);
      res.status(500).json({
          error: 'فشل في تحديث المدير: ' + error.message,
          status: 'error'
      });
  }
});

// 8. حذف مدير (تعطيل)
app.delete('/api/redox-admin/school/:schoolId/admin/:adminId', async (req, res) => {
  try {
      const school = await School.findById(req.params.schoolId);
      if (!school) {
          return res.status(404).json({
              error: 'المدرسة غير موجودة',
              status: 'error'
          });
      }

      // منع حذف المدير الأساسي (super_admin)
      const admin = school.admins.id(req.params.adminId);
      if (!admin) {
          return res.status(404).json({
              error: 'المدير غير موجود',
              status: 'error'
          });
      }

      if (admin.role === 'super_admin') {
          return res.status(400).json({
              error: 'لا يمكن حذف المدير الأساسي للمدرسة',
              status: 'error'
          });
      }

      admin.isActive = false;
      await school.save();

      res.json({
          message: '✅ تم تعطيل المدير بنجاح',
          status: 'success'
      });
  } catch (error) {
      res.status(500).json({
          error: 'فشل في حذف المدير: ' + error.message,
          status: 'error'
      });
  }
});

// 9. تجديد اشتراك المدرسة
app.post('/api/redox-admin/school/:id/renew-subscription', async (req, res) => {
  try {
      const { plan, amount, durationMonths = 12, paymentMethod, notes } = req.body;

      const school = await School.findById(req.params.id);
      if (!school) {
          return res.status(404).json({
              error: 'المدرسة غير موجودة',
              status: 'error'
          });
      }

      // تجديد الاشتراك
      school.renewSubscription(plan, amount, durationMonths);

      // إضافة دفعة جديدة
      if (amount > 0) {
          school.addSubscriptionPayment(amount, paymentMethod || 'cash', notes || 'تجديد اشتراك');
      }

      await school.save();

      res.json({
          message: '✅ تم تجديد الاشتراك بنجاح',
          subscription: {
              plan: school.subscription.plan,
              planName: school.subscription.planName,
              startDate: school.subscription.startDate,
              endDate: school.subscription.endDate,
              amount: school.subscription.amount,
              daysRemaining: school.getSubscriptionDaysRemaining(),
              isActive: school.isSubscriptionActive(),
              features: school.getActiveFeatures()
          },
          status: 'success'
      });
  } catch (error) {
      console.error('❌ خطأ في تجديد الاشتراك:', error);
      res.status(500).json({
          error: 'فشل في تجديد الاشتراك: ' + error.message,
          status: 'error'
      });
  }
});

// 10. إشعارات انتهاء الاشتراك
app.get('/api/redox-admin/subscription/expiring-soon', async (req, res) => {
  try {
      const { days = 30 } = req.query;
      const now = new Date();
      const future = new Date(now);
      future.setDate(future.getDate() + parseInt(days));

      const schools = await School.find({
          'subscription.status': 'active',
          'subscription.endDate': { $gte: now, $lte: future }
      }).select('name email phone schoolKey subscription');

      const expiringSchools = schools.map(school => ({
          _id: school._id,
          name: school.name,
          email: school.email,
          phone: school.phone,
          schoolKey: school.schoolKey,
          endDate: school.subscription.endDate,
          daysRemaining: school.getSubscriptionDaysRemaining(),
          plan: school.subscription.plan,
          planName: school.subscription.planName
      }));

      res.json({
          expiringSchools,
          count: expiringSchools.length,
          status: 'success'
      });
  } catch (error) {
      console.error('❌ خطأ في جلب الاشتراكات المنتهية قريباً:', error);
      res.status(500).json({
          error: 'فشل في جلب الاشتراكات: ' + error.message,
          status: 'error'
      });
  }
});

// 11. إحصائيات المدارس مع الاشتراكات
app.get('/api/redox-admin/schools/stats', async (req, res) => {
  try {
      const total = await School.countDocuments();
      const active = await School.countDocuments({ status: 'active' });
      const expired = await School.countDocuments({ status: 'expired' });
      const inactive = await School.countDocuments({ status: 'inactive' });

      // إحصائيات الاشتراكات
      const subscriptionStats = await School.aggregate([
          { $group: {
              _id: '$subscription.plan',
              count: { $sum: 1 }
          } }
      ]);

      // إجمالي الإيرادات من الاشتراكات
      const revenue = await School.aggregate([
          { $group: {
              _id: null,
              total: { $sum: '$subscription.amount' }
          } }
      ]);

      // الاشتراكات المنتهية قريباً (30 يوم)
      const now = new Date();
      const future = new Date(now);
      future.setDate(future.getDate() + 30);

      const expiringSoon = await School.countDocuments({
          'subscription.status': 'active',
          'subscription.endDate': { $gte: now, $lte: future }
      });

      res.json({
          stats: {
              total,
              active,
              expired,
              inactive,
              expiringSoon
          },
          subscriptionStats,
          totalRevenue: revenue[0]?.total || 0,
          status: 'success'
      });
  } catch (error) {
      console.error('❌ خطأ في جلب الإحصائيات:', error);
      res.status(500).json({
          error: 'فشل في جلب الإحصائيات: ' + error.message,
          status: 'error'
      });
  }
});

// 12. تسجيل دخول المدير
app.post('/api/redox-admin/school/login', async (req, res) => {
  try {
      const { username, password, schoolKey } = req.body;

      if (!username || !password || !schoolKey) {
          return res.status(400).json({
              error: 'اسم المستخدم، كلمة المرور، ومفتاح المدرسة مطلوبة',
              status: 'error'
          });
      }

      // البحث عن المدرسة
      const school = await School.findOne({ schoolKey, status: { $ne: 'inactive' } });
      if (!school) {
          return res.status(404).json({
              error: 'المدرسة غير موجودة أو غير نشطة',
              status: 'error'
          });
      }

      // البحث عن المدير
      const admin = school.admins.find(
          a => a.username === username && a.isActive === true
      );

      if (!admin) {
          return res.status(401).json({
              error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
              status: 'error'
          });
      }

      // التحقق من كلمة المرور
      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
          return res.status(401).json({
              error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
              status: 'error'
          });
      }

      // تحديث آخر تسجيل دخول
      admin.lastLogin = new Date();
      await school.save();

      // التحقق من صلاحية الاشتراك
      const isSubscriptionActive = school.isSubscriptionActive();
      const daysRemaining = school.getSubscriptionDaysRemaining();

      // إنشاء توكن
// في نقطة /api/auth/login
const token = jwt.sign(
    {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        schoolId: school._id, // ✅ تم إضافة schoolId هنا
        schoolKey: school.schoolKey,
        permissions: admin.permissions
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '8h' }
);
      res.json({
          message: '✅ تم تسجيل الدخول بنجاح',
          token,
          admin: {
              _id: admin._id,
              username: admin.username,
              fullName: admin.fullName,
              role: admin.role,
              email: admin.email,
              phone: admin.phone,
              permissions: admin.permissions
          },
          school: {
              _id: school._id,
              name: school.name,
              schoolKey: school.schoolKey,
              subscription: {
                  plan: school.subscription.plan,
                  planName: school.subscription.planName,
                  endDate: school.subscription.endDate,
                  isActive: isSubscriptionActive,
                  daysRemaining: daysRemaining,
                  features: school.getActiveFeatures()
              }
          },
          status: 'success'
      });
  } catch (error) {
      console.error('❌ خطأ في تسجيل الدخول:', error);
      res.status(500).json({
          error: 'فشل في تسجيل الدخول: ' + error.message,
          status: 'error'
      });
  }
});

// 13. التحقق من صلاحية الاشتراك لمدرسة
app.get('/api/redox-admin/school/check-subscription/:schoolKey', async (req, res) => {
  try {
      const { schoolKey } = req.params;

      const school = await School.findOne({ schoolKey });
      if (!school) {
          return res.status(404).json({
              error: 'المدرسة غير موجودة',
              status: 'error'
          });
      }

      const isActive = school.isSubscriptionActive();
      const daysRemaining = school.getSubscriptionDaysRemaining();
      const isExpired = school.isSubscriptionExpired();
      const features = school.getActiveFeatures();

      res.json({
          valid: isActive,
          school: {
              _id: school._id,
              name: school.name,
              schoolKey: school.schoolKey,
              status: school.status
          },
          subscription: {
              plan: school.subscription.plan,
              planName: school.subscription.planName,
              startDate: school.subscription.startDate,
              endDate: school.subscription.endDate,
              isActive,
              isExpired,
              daysRemaining,
              features
          },
          status: 'success'
      });
  } catch (error) {
      console.error('❌ خطأ في التحقق من الاشتراك:', error);
      res.status(500).json({
          error: 'فشل في التحقق من الاشتراك: ' + error.message,
          status: 'error'
      });
  }
});
  //count students number
// ==============================================
// 📊 إحصائيات المدرسة المحددة فقط
// ==============================================

// 1. عدد الطلاب في مدرسة محددة
app.get('/api/count/students', async (req, res) => {
  try {
    // جلب schoolId من الـ query أو من التوكن
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    let query = {};
    if (schoolId) {
      // إذا كانت المدرسة تستخدم حقل schoolId في نموذج Student
      query.schoolId = schoolId;
    }

    const count = await Student.countDocuments(query);
    res.json({ count, status: 'success' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to count students', status: 'error' });
  }
});

// ==============================================
// 📚 جلب حصص طالب معين (Endpoint مفقود)
// ==============================================
app.get('/api/students/:studentId/classes', async (req, res) => {
  try {
    const { studentId } = req.params;
    const schoolId = req.user?.schoolId || req.query.schoolId;

    console.log(`📚 جلب حصص الطالب: ${studentId}`);
    console.log(`🏫 schoolId: ${schoolId}`);

    // 1. التحقق من وجود schoolId
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'schoolId مطلوب',
      });
    }

    // 2. التحقق من صحة studentId
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الطالب غير صالح',
      });
    }

    // 3. جلب الطالب مع التأكد من أنه ينتمي للمدرسة
    const student = await Student.findOne({
      _id: studentId,
      schoolId: schoolId,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'الطالب غير موجود أو لا ينتمي للمدرسة',
      });
    }

    // 4. جلب الحصص التي تم ربطها بالطالب
    const classes = await Class.find({
      _id: { $in: student.classes || [] },
      schoolId: schoolId, // تصفية حسب المدرسة أيضاً
    })
      .populate('teacher', 'name phone email')
      .populate('schedule.classroom', 'name location')
      .populate('students', 'name studentId'); // تأكد من وجود هذه العلاقة

    console.log(`✅ تم العثور على ${classes.length} حصة للطالب: ${student.name}`);

    // 5. إعادة البيانات
    res.json({
      success: true,
      data: classes,
    });
  } catch (err) {
    console.error('❌ خطأ في جلب حصص الطالب:', err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// 2. عدد الأساتذة في مدرسة محددة
// عدد الأساتذة في مدرسة محددة
app.get('/api/count/teachers', async (req, res) => {
  try {
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    let query = {};
    if (schoolId) {
      query.schoolId = schoolId;
    } else {
      return res.json({ count: 0, status: 'success', message: 'لم يتم تحديد مدرسة' });
    }

    const count = await Teacher.countDocuments(query);
    console.log(`📊 عدد الأساتذة في المدرسة ${schoolId}: ${count}`);
    
    res.json({ 
      count, 
      status: 'success',
      schoolId: schoolId
    });
  } catch (error) {
    console.error('❌ خطأ في عد الأساتذة:', error);
    res.status(500).json({ 
      error: 'Failed to count teachers', 
      status: 'error' 
    });
  }
});


// 3. عدد الحصص في مدرسة محددة
app.get('/api/count/classes', async (req, res) => {
  try {
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    let query = {};
    if (schoolId) {
      query.schoolId = schoolId;
    }

    const count = await Class.countDocuments(query);
    res.json({ count, status: 'success' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to count classes', status: 'error' });
  }
});

// 4. نقطة نهاية موحدة للحصول على جميع الإحصائيات لمدرسة محددة
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    // جلب schoolId من الـ query أو من التوكن
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    if (!schoolId) {
      return res.status(400).json({ 
        success: false,
        error: 'School ID is required' 
      });
    }

    const query = { schoolId: schoolId };

    const [students, teachers, classes] = await Promise.all([
      Student.countDocuments(query),
      Teacher.countDocuments(query),
      Class.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        students,
        teachers,
        classes,
        schoolId
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});
// ==============================================
// 📚 GET CLASSES - Filtered by School ID
// ==============================================
app.get('/api/classes', async (req, res) => {
  try {
    // Get schoolId from query (priority) or user token
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    console.log('📚 Fetching classes - schoolId:', schoolId);
    
    // If no schoolId, return empty array
    if (!schoolId) {
      console.warn('⚠️ No schoolId provided, returning empty list');
      return res.json([]);
    }
    
    // Validate schoolId format
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف المدرسة غير صالح'
      });
    }
    
    // Check if school exists
    const school = await School.findById(schoolId);
    if (!school) {
      console.warn(`⚠️ School not found: ${schoolId}`);
      return res.json([]);
    }
    
    // Build query with filters
    const { academicYear, subject, teacher } = req.query;
    const query = { schoolId: schoolId };
    
    if (academicYear) query.academicYear = academicYear;
    if (subject) query.subject = subject;
    if (teacher) query.teacher = teacher;
    
    // Fetch classes with population
    const classes = await Class.find(query)
      .populate('teacher', 'name phone email')
      .populate('students', 'name studentId parentPhone')
      .populate('schedule.classroom', 'name location capacity')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${classes.length} classes for school ${schoolId}`);
    res.json(classes);
    
  } catch (err) {
    console.error('❌ Error fetching classes:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get('/api/classes/my-school', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId;
    
    if (!schoolId) {
      return res.status(401).json({
        success: false,
        error: 'غير مصرح بالدخول - يرجى تسجيل الدخول'
      });
    }

    const classes = await Class.find({ schoolId: schoolId })
      .populate('teacher')
      .populate('students')
      .populate('schedule.classroom')
      .sort({ createdAt: -1 });
    
    console.log(`✅ تم جلب ${classes.length} حصة للمدرسة ${schoolId}`);
    res.json(classes);
    
  } catch (err) {
    console.error('❌ خطأ في جلب حصص المدرسة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
// POST /api/classes - متوافق مع الواجهة الحالية
app.post('/api/classes', async (req, res) => {
  try {
    console.log('📝 استلام طلب إنشاء حصة جديدة:', req.body);
    
    const schoolId = req.user?.schoolId || req.body.schoolId;
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'المدرسة غير موجودة'
      });
    }

    const { name, subject, teacher, academicYear, description, schedule, price, paymentSystem, roundSettings, students } = req.body;
    
    // التحقق من وجود الأستاذ
    if (teacher) {
      const teacherExists = await Teacher.findOne({ _id: teacher, schoolId: schoolId });
      if (!teacherExists) {
        return res.status(400).json({
          success: false,
          error: 'الأستاذ غير موجود أو لا ينتمي للمدرسة'
        });
      }
    }

    // التحقق من وجود حصة بنفس الاسم
    const existingClass = await Class.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      subject: subject,
      teacher: teacher,
      academicYear: academicYear,
      schoolId: schoolId
    });

    if (existingClass) {
      return res.status(200).json({
        success: true,
        message: "الحصة موجودة مسبقاً في هذه المدرسة",
        class: existingClass,
        existed: true
      });
    }

    // إنشاء الحصة
    const classObj = new Class({
      schoolId: schoolId,
      name: name,
      subject: subject,
      teacher: teacher,
      academicYear: academicYear,
      description: description || '',
      schedule: schedule || [],
      price: price || 0,
      paymentSystem: paymentSystem || 'monthly',
      roundSettings: roundSettings || { sessionCount: 8, sessionDuration: 2, breakBetweenSessions: 0 },
      students: students || []
    });

    await classObj.save();
    
    console.log(`✅ تم إنشاء الحصة: ${classObj.name} للمدرسة: ${schoolId}`);

    // ==============================================
    // 🔥 إنشاء عمولات الأساتذة تلقائياً (إذا وجد أستاذ وطلاب)
    // ==============================================
    let teacherCommission = null;
    const commissionResults = [];
    
    if (teacher && students && students.length > 0) {
      console.log(`📊 إنشاء عمولات للأستاذ ${teacher} لـ ${students.length} طالب`);
      
      const teacherSharePercentage = 70;
      const teacherShare = (price || 0) * (teacherSharePercentage / 100);
      const currentMonth = new Date().toISOString().slice(0, 7);
      
      // جلب أسماء الطلاب
      const studentDocs = await Student.find({ _id: { $in: students } });
      const studentMap = {};
      studentDocs.forEach(s => studentMap[s._id] = s.name);
      
      // إنشاء سجل العمولة الرئيسي
      teacherCommission = new TeacherCommission({
        schoolId: schoolId,
        teacher: teacher,
        class: classObj._id,
        month: currentMonth,
        totalAmount: teacherShare * students.length,
        percentage: teacherSharePercentage,
        status: 'pending',
        totalPaid: 0,
        remainingAmount: teacherShare * students.length,
        recordedBy: req.user?.id || null,
        students: students.map(studentId => ({
          student: studentId,
          studentName: studentMap[studentId] || 'غير معروف',
          attendancesCount: 0,
          teacherShare: teacherShare,
          status: 'pending',
          isActive: true
        }))
      });

      await teacherCommission.save();
      console.log(`✅ تم إنشاء سجل العمولة الرئيسي: ${teacherCommission._id}`);

      // إنشاء دفعات شهرية للطلاب
      for (const studentId of students) {
        const student = await Student.findById(studentId);
        
        const payment = new Payment({
          schoolId: schoolId,
          student: studentId,
          class: classObj._id,
          amount: price || 0,
          month: new Date(currentMonth).toLocaleString('ar-EG', { month: 'long', year: 'numeric' }),
          monthCode: currentMonth,
          status: 'pending',
          recordedBy: req.user?.id || null,
          commissionRecorded: true,
          commissionId: teacherCommission._id
        });
        await payment.save();
        
        // إنشاء دفعات للأشهر القادمة (11 شهر)
        for (let i = 1; i < 12; i++) {
          const date = new Date(currentMonth);
          date.setMonth(date.getMonth() + i);
          const monthStr = date.toISOString().slice(0, 7);
          
          const existingPayment = await Payment.findOne({
            schoolId: schoolId,
            student: studentId,
            class: classObj._id,
            monthCode: monthStr
          });

          if (!existingPayment) {
            const futurePayment = new Payment({
              schoolId: schoolId,
              student: studentId,
              class: classObj._id,
              amount: price || 0,
              month: date.toLocaleString('ar-EG', { month: 'long', year: 'numeric' }),
              monthCode: monthStr,
              status: 'pending',
              recordedBy: req.user?.id || null,
              commissionRecorded: true,
              commissionId: teacherCommission._id
            });
            await futurePayment.save();
          }
        }
        
        commissionResults.push({
          student: student?.name || 'غير معروف',
          studentId: studentId,
          amount: teacherShare,
          paymentCreated: true
        });
      }
      
      console.log(`✅ تم إنشاء ${commissionResults.length} عمولة ودفعات للأستاذ`);
    }

    // جلب البيانات المحدثة (بنفس تنسيق الواجهة الحالية)
    const populatedClass = await Class.findById(classObj._id)
      .populate('teacher', 'name phone email')
      .populate('students', 'name studentId')
      .populate('schedule.classroom', 'name location');

    // إرجاع الاستجابة بنفس تنسيق الواجهة الحالية
    res.status(201).json({
      success: true,
      message: "تم إنشاء الحصة بنجاح",
      class: populatedClass,
      existed: false,
      // إضافة معلومات العمولة في نفس الرد (لن تؤثر على الواجهة الحالية)
      _commission: teacherCommission ? {
        id: teacherCommission._id,
        totalAmount: teacherCommission.totalAmount,
        studentsCount: teacherCommission.students.length,
        status: teacherCommission.status
      } : null,
      _commissionResults: commissionResults
    });

  } catch (err) {
    console.error('❌ خطأ في إنشاء الحصة:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});


    // Authorized Cards Management
    app.get('/api/authorized-cards',  async (req, res) => {
      try {
        const { active, expired } = req.query;
        const query = {};

        if (active !== undefined) query.active = active === 'true';
        if (expired === 'true') {
          query.expirationDate = { $lt: new Date() };
        } else if (expired === 'false') {
          query.expirationDate = { $gte: new Date() };
        }

        const cards = await AuthorizedCard.find(query)
          .populate('createdBy', 'username fullName')
          .sort({ createdAt: -1 });
        
        res.json(cards);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/api/authorized-cards', async (req, res) => {
      try {
        const { uid, cardName, description, expirationDate, notes } = req.body;
        
        // Check if card already exists
        const existingCard = await AuthorizedCard.findOne({ uid });
        if (existingCard) {
          return res.status(400).json({ error: 'البطاقة مسجلة مسبقاً في النظام' });
        }

        const authorizedCard = new AuthorizedCard({
          uid,
          cardName,
          description,
          expirationDate: new Date(expirationDate),
          notes,
        });

        await authorizedCard.save();
        
        // Populate createdBy field for response
        await authorizedCard.populate('createdBy', 'username fullName');
        
        res.status(201).json(authorizedCard);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    app.put('/api/authorized-cards/:id',  async (req, res) => {
      try {
        const { cardName, description, expirationDate, active, notes } = req.body;
        
        const authorizedCard = await AuthorizedCard.findByIdAndUpdate(
          req.params.id,
          {
            cardName,
            description,
            expirationDate: expirationDate ? new Date(expirationDate) : undefined,
            active,
            notes
          },
          { new: true }
        ).populate('createdBy', 'username fullName');

        if (!authorizedCard) {
          return res.status(404).json({ error: 'البطاقة غير موجودة' });
        }

        res.json(authorizedCard);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    app.delete('/api/authorized-cards/:id', async (req, res) => {
      try {
        const authorizedCard = await AuthorizedCard.findByIdAndDelete(req.params.id);
        
        if (!authorizedCard) {
          return res.status(404).json({ error: 'البطاقة غير موجودة' });
        }

        res.json({ message: 'تم حذف البطاقة بنجاح' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Check if card is authorized before assignment
    app.get('/api/authorized-cards/check/:uid', async (req, res) => {
      try {
        const { uid } = req.params;
        
        const authorizedCard = await AuthorizedCard.findOne({ 
          uid, 
          active: true,
          expirationDate: { $gte: new Date() }
        });

        if (!authorizedCard) {
          return res.status(404).json({ 
            error: 'البطاقة غير مصرحة أو منتهية الصلاحية',
            authorized: false 
          });
        }

        res.json({
          authorized: true,
          card: authorizedCard,
          message: 'البطاقة مصرحة وصالحة'
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });



















    let serialPort = null;

    function initializeRFIDReader() {
      const portName = process.env.RFID_PORT;
      const baudRate = parseInt(process.env.RFID_BAUD_RATE) || 9600;

      if (!portName) {
        console.error('RFID_PORT not configured in .env file');
        return;
      }

      console.log(`Attempting to connect to RFID reader on ${portName}...`);

      // Close existing port if it exists
      if (serialPort && serialPort.isOpen) {
        serialPort.close();
      }

      try {
        serialPort = new SerialPort({
          path: portName,
          baudRate: baudRate,
          lock: false
        }, (err) => {
          if (err) {
            console.error(`Failed to open RFID port ${portName}:`, err.message);
            console.log('Retrying in 5 seconds...');
            setTimeout(initializeRFIDReader, 5000);
            return;

          }
          console.log(`RFID reader connected successfully on ${portName}`);
        });

        const parser = serialPort.pipe(new ReadlineParser({ delimiter: '\r\n' }));

        parser.on('data', async (data) => {
          console.log('Raw RFID data:', data); // Debug output
          
          if (data.length > 0) {
            const uid = data.trim();
            console.log('Potential UID:', uid);
            io.emit('raw-data', { data, uid }); // Send to frontend for debugging
          }

          if (data.startsWith('UID:')) {
            const uid = data.trim().substring(4).trim();
            console.log('Card detected:', uid);

            try {
              const card = await Card.findOne({ uid }).populate('student');
              if (card) {
                const student = await Student.findById(card.student._id)
                  .populate({
                    path: 'classes',
                    populate: [
                      { path: 'teacher', model: 'Teacher' },
                      { path: 'students', model: 'Student' }
                    ]
                  });

                const payments = await Payment.find({ student: card.student._id, status: { $in: ['pending', 'late'] } })
                  .populate('class');

                // Check if any class is scheduled now
                const now = new Date();
                const day = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][now.getDay()];
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();

                let currentClass = null;

                for (const cls of student.classes || []) {
                  for (const schedule of cls.schedule || []) {
                    if (schedule.day === day) {
                      const [hour, minute] = schedule.time.split(':').map(Number);
                      if (Math.abs((hour - currentHour) * 60 + (minute - currentMinute)) <= 30) {
                        currentClass = cls;
                        break;
                      }
                    }
                  }
                  if (currentClass) break;
                }

                if (currentClass) {
                  // Record attendance
                  const attendance = new Attendance({
                    student: student._id,
                    class: currentClass._id,
                    date: now,
                    status: 'present'
                  });
                  await attendance.save();

                  // Send SMS to parent
                  // const smsContent = `تم تسجيل حضور الطالب ${student.name} في حصة ${currentClass.name} في ${now.toLocaleString()}`;

                  try {
                    await smsGateway.send(student.parentPhone, smsContent);
                    await Message.create({
                      sender: null,
                      recipients: [{ student: student._id, parentPhone: student.parentPhone }],
                      class: currentClass._id,
                      content: smsContent,
                      messageType: 'individual'
                    });
                  } catch (smsErr) {
                    console.error('Failed to send SMS:', smsErr);
                  }
                }

                io.emit('student-detected', {
                  student,
                  card,
                  classes: student.classes || [],
                  payments: payments || [],
                  currentClass
                });
              } else {
                io.emit('unknown-card', { uid });
              }
            } catch (err) {
              console.error('Error processing card:', err);
              io.emit('card-error', { error: 'Error processing card' });
            }
          }
        });

        serialPort.on('error', err => {
          console.error('RFID reader error:', err.message);
          setTimeout(initializeRFIDReader, 5000);
        });
        
        serialPort.on('close', () => {
          console.log('RFID port closed, attempting to reconnect...');
          setTimeout(initializeRFIDReader, 5000);
        });

      } catch (err) {
        console.error('RFID initialization error:', err.message);
        // setTimeout(initializeRFIDReader, 5000);
      }
    }

    // Connect to MongoDB
    mongoose.connect(process.env.MONGODB_URI)
      .then(() => console.log('Database connection successful'))
      .catch(err => console.error("Error connecting to Database:", err));

    // JWT Authentication Middleware
    // Update authenticate middleware to check for accounting access
    // Update your authenticate middleware to handle single role or array
    // const authenticate = (roles = []) => {
    //   return (req, res, next) => {
    //     try {
    //       const token = req.headers.authorization?.split(' ')[1];
          
    //       if (!token) {
    //         // For count endpoints, you might want to allow public access
    //         if (req.path.includes('/count')) {
    //           return next();
    //         }
    //         return res.status(401).json({ error: 'غير مصرح بالدخول' });
    //       }
    
    //       const decoded = jwt.verify(token, process.env.JWT_SECRET);
    //       req.user = decoded;
    
    //       if (roles.length && !roles.includes(decoded.role)) {
    //         return res.status(403).json({ error: 'غير مصرح بالوصول لهذه الصلاحية' });
    //       }
    
    //       next();
    //     } catch (err) {
    //       // For count endpoints, allow continuation even if token is invalid
    //       if (req.path.includes('/count')) {
    //         return next();
    //       }
    //       res.status(401).json({ error: 'رمز الدخول غير صالح' });
    //     }
    //   };
    // };


const authenticate = (roles = []) => {
  return (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'غير مصرح بالدخول' });
      }
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      
      // ✅ إضافة schoolId إلى req.user إذا كان موجوداً في التوكن
      if (decoded.schoolId) {
        req.user.schoolId = decoded.schoolId;
      }
      
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({ error: 'غير مصرح بالوصول لهذه الصلاحية' });
      }
      
      next();
    } catch (err) {
      res.status(401).json({ error: 'رمز الدخول غير صالح' });
    }
  };
};
  const optionalAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
        }
        next();
    } catch (err) {
        next(); // استمر حتى لو فشلت المصادقة
    }
  };

    
    // Email Configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    // API Routes

    // Auth Routes
// Auth Routes
// ==============================================
// نقطة نهاية تسجيل الدخول المحسنة - تدعم كلا النظامين
// ==============================================


// ==============================================
// ✅ تحديث بيانات المدرسة (الهاتف، الإيميل، العنوان)
// ==============================================
app.put('/api/school/update', authenticate(), async (req, res) => {
  try {
    const { phone, email, address } = req.body;
    const schoolId = req.user?.schoolId;
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'لم يتم تحديد المدرسة'
      });
    }

    console.log(`📝 تحديث بيانات المدرسة: ${schoolId}`);
    console.log(`📞 الهاتف: ${phone}`);
    console.log(`📧 الإيميل: ${email}`);
    console.log(`📍 العنوان: ${address}`);

    // تحديث المدرسة
    const school = await School.findByIdAndUpdate(
      schoolId,
      { 
        phone: phone || '',
        email: email || '',
        address: address || ''
      },
      { new: true }
    );

    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'المدرسة غير موجودة'
      });
    }

    // تحديث Local Storage في الواجهة (سيتم عبر الاستجابة)
    const schoolData = {
      _id: school._id,
      name: school.name,
      schoolKey: school.schoolKey,
      phone: school.phone || '',
      email: school.email || '',
      address: school.address || ''
    };

    console.log('✅ تم تحديث بيانات المدرسة:', schoolData);

    res.json({
      success: true,
      message: 'تم تحديث بيانات المدرسة بنجاح',
      school: schoolData
    });

  } catch (err) {
    console.error('❌ خطأ في تحديث بيانات المدرسة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, schoolKey } = req.body;
    
    console.log('📤 محاولة تسجيل دخول:', username);
    console.log('🔑 مفتاح المدرسة:', schoolKey);

    // 1. البحث عن المدرسة باستخدام المفتاح
    const school = await School.findOne({ schoolKey });
    
    if (!school) {
      console.log('❌ المدرسة غير موجودة للمفتاح:', schoolKey);
      return res.status(404).json({
        success: false,
        error: 'المدرسة غير موجودة أو المفتاح غير صحيح'
      });
    }

    // 2. البحث عن المدير في المدرسة
    const admin = school.admins.find(a => a.username === username);
    
    if (!admin) {
      console.log('❌ المدير غير موجود للمستخدم:', username);
      return res.status(401).json({
        success: false,
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }

    // 3. التحقق من كلمة المرور
    const isValidPassword = await bcrypt.compare(password, admin.password);
    
    if (!isValidPassword) {
      console.log('❌ كلمة مرور غير صحيحة للمستخدم:', username);
      return res.status(401).json({
        success: false,
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة'
      });
    }

    // 4. تحديث آخر تسجيل دخول
    admin.lastLogin = new Date();
    await school.save();

    // 5. إنشاء التوكن
    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        schoolId: school._id,
        schoolKey: school.schoolKey,
        permissions: admin.permissions
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );

    console.log('✅ تم تسجيل دخول ناجح للمستخدم:', username);

    // ✅ 6. التأكد من وجود phone, email, address مع قيم افتراضية إذا كانت فارغة
    const schoolData = {
      _id: school._id,
      name: school.name,
      schoolKey: school.schoolKey,
      phone: school.phone || '0555123456',     // ✅ قيمة افتراضية إذا كانت فارغة
      email: school.email || 'redox@example.com', // ✅ قيمة افتراضية إذا كانت فارغة
      address: school.address || 'الجزائر - العاصمة - شارع الاستقلال', // ✅ قيمة افتراضية إذا كانت فارغة
      subscription: {
        plan: school.subscription?.plan,
        planName: school.subscription?.planName,
        isActive: school.isSubscriptionActive ? school.isSubscriptionActive() : true,
        daysRemaining: school.getSubscriptionDaysRemaining ? school.getSubscriptionDaysRemaining() : 365
      }
    };

    console.log('📦 بيانات المدرسة المرسلة:', schoolData);

    // 7. إرجاع البيانات
    res.json({
      success: true,
      data: {
        token: token,
        user: {
          id: admin._id,
          username: admin.username,
          role: admin.role,
          fullName: admin.fullName,
          email: admin.email,
          phone: admin.phone,
          permissions: admin.permissions
        },
        school: schoolData
      }
    });

  } catch (err) {
    console.error('❌ خطأ في تسجيل الدخول:', err);
    res.status(500).json({
      success: false,
      error: 'حدث خطأ أثناء تسجيل الدخول: ' + err.message
    });
  }
});

    app.post('/api/auth/change-password',  async (req, res) => {
      try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);

        if (!(await bcrypt.compare(currentPassword, user.password))) {
          return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Users Management (Admin only)
    app.get('/api/users',  async (req, res) => {
      try {
        const users = await User.find().select('-password');
        res.json(users);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/api/users', async (req, res) => {
      try {
        const { username, password, role, ...rest } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
          return res.status(400).json({ error: 'اسم المستخدم موجود مسبقا' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
          username,
          password: hashedPassword,
          role,
          ...rest
        });

        await user.save();

        res.status(201).json({
          _id: user._id,
          username: user.username,
          role: user.role,
          fullName: user.fullName
        });
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    // Students
    // get only active students
  // Replace this problematic code in /api/students endpoint:
// ==============================================
// 📚 جلب طلاب المدرسة المحددة فقط - FIXED ✅
// ==============================================

// ==============================================
// 📚 جلب طلاب المدرسة المحددة فقط - FIXED ✅
// ==============================================

// ==============================================
// 📚 GET STUDENTS - Filtered by School ID
// ==============================================

// ==============================================
// 📚 GET STUDENTS - Filtered by School ID
// ==============================================

// ==============================================
// 📚 GET STUDENTS - Filtered by School ID
// ==============================================

// ==============================================
// 📚 GET STUDENTS - Filtered by School ID
// ==============================================

app.get('/api/students', async (req, res) => {
  try {
    // Get schoolId from query or user token
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    console.log('📚 Fetching students - schoolId:', schoolId);
    
    // ✅ إذا لم يكن هناك schoolId، أرجع قائمة فارغة
    if (!schoolId) {
      console.warn('⚠️ No schoolId provided, returning empty list');
      return res.json([]);
    }
    
    // ✅ تحقق من وجود المدرسة
    const school = await School.findById(schoolId);
    if (!school) {
      console.warn(`⚠️ School not found: ${schoolId}`);
      return res.json([]);
    }
    
    // ✅ جلب الطلاب الذين ينتمون للمدرسة فقط
    const students = await Student.find({ schoolId: schoolId })
      .populate('classes')
      .sort({ name: 1 });
    
    console.log(`✅ Found ${students.length} students for school ${schoolId}`);
    res.json(students);
    
  } catch (err) {
    console.error('❌ Error fetching students:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});


  // ObjectId validation middleware
  const validateObjectId = (req, res, next) => {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'معرف غير صالح' });
    }
    
    next();
  };





    //get all students
    // app.get('/api/allstudents',/* */ ()=>{
    //   try {
    //     const students = Student.find();
    //     res.json(students);
    //   } catch (err) {
    //     res.status(500).json({ error: err.message });
    //   }
    // })


// GET /api/accounting/teacher-commissions - متوافق مع الواجهة الحالية
app.get('/api/accounting/teacher-commissions', async (req, res) => {
  try {
    const { schoolId, teacherId, status, month, classId } = req.query;
    
    console.log('📊 جلب العمولات - filters:', { schoolId, teacherId, status, month, classId });
    
    const filter = {};
    
    // إذا كان هناك schoolId في التوكن أو في الـ query
    const effectiveSchoolId = schoolId || req.user?.schoolId;
    if (effectiveSchoolId) filter.schoolId = effectiveSchoolId;
    if (teacherId) filter.teacher = teacherId;
    if (status) filter.status = status;
    if (month) filter.month = month;
    if (classId) filter.class = classId;

    const commissions = await TeacherCommission.find(filter)
      .populate('teacher', 'name phone email subjects')
      .populate('class', 'name subject price')
      .populate('students.student', 'name studentId parentPhone')
      .populate('recordedBy', 'username fullName')
      .sort({ month: -1, createdAt: -1 });

    // حساب الإحصائيات (بنفس تنسيق الواجهة)
    const summary = {
      total: commissions.length,
      totalAmount: commissions.reduce((sum, c) => sum + c.totalAmount, 0),
      totalPaid: commissions.reduce((sum, c) => sum + c.totalPaid, 0),
      totalRemaining: commissions.reduce((sum, c) => sum + c.remainingAmount, 0),
      pendingCount: commissions.filter(c => c.status === 'pending').length,
      partialCount: commissions.filter(c => c.status === 'partial').length,
      paidCount: commissions.filter(c => c.status === 'paid').length,
      cancelledCount: commissions.filter(c => c.status === 'cancelled').length,
      totalStudents: commissions.reduce((sum, c) => sum + c.students.filter(s => s.isActive !== false).length, 0)
    };

    // تجميع حسب الشهر (للواجهة)
    const byMonth = {};
    commissions.forEach(c => {
      if (!byMonth[c.month]) {
        byMonth[c.month] = {
          month: c.month,
          total: 0,
          paid: 0,
          pending: 0,
          count: 0,
          teachers: new Set()
        };
      }
      byMonth[c.month].total += c.totalAmount;
      byMonth[c.month].paid += c.totalPaid;
      byMonth[c.month].pending += c.remainingAmount;
      byMonth[c.month].count++;
      if (c.teacher) byMonth[c.month].teachers.add(c.teacher._id.toString());
    });

    // إرجاع الاستجابة بنفس تنسيق الواجهة الحالية
    res.json({
      success: true,
      data: commissions,
      summary: summary,
      byMonth: Object.values(byMonth).map(m => ({
        ...m,
        teachersCount: m.teachers.size,
        teachers: undefined
      })),
      count: commissions.length
    });

  } catch (err) {
    console.error('❌ خطأ في جلب العمولات:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
// GET /api/accounting/teacher-commissions/pending - متوافق مع الواجهة الحالية
app.get('/api/accounting/teacher-commissions/pending', async (req, res) => {
  try {
    const { schoolId, month, teacherId } = req.query;
    
    console.log('📊 جلب العمولات المستحقة - month:', month);
    
    if (!month) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد الشهر (month) بصيغة YYYY-MM'
      });
    }

    const effectiveSchoolId = schoolId || req.user?.schoolId;
    
    const filter = {
      month: month,
      status: { $in: ['pending', 'partial'] }
    };
    
    if (effectiveSchoolId) filter.schoolId = effectiveSchoolId;
    if (teacherId) filter.teacher = teacherId;

    const commissions = await TeacherCommission.find(filter)
      .populate('teacher', 'name phone email')
      .populate('class', 'name subject price')
      .populate('students.student', 'name studentId')
      .populate('recordedBy', 'username fullName')
      .sort({ teacher: 1 });

    // تجميع حسب الأستاذ (للواجهة)
    const byTeacher = {};
    commissions.forEach(c => {
      const teacherName = c.teacher?.name || 'غير معروف';
      const teacherId = c.teacher?._id?.toString() || 'unknown';
      
      if (!byTeacher[teacherId]) {
        byTeacher[teacherId] = {
          teacherId: teacherId,
          teacherName: teacherName,
          totalAmount: 0,
          totalPaid: 0,
          totalRemaining: 0,
          studentsCount: 0,
          commissions: [],
          classes: new Set()
        };
      }
      
      byTeacher[teacherId].totalAmount += c.totalAmount;
      byTeacher[teacherId].totalPaid += c.totalPaid;
      byTeacher[teacherId].totalRemaining += c.remainingAmount;
      byTeacher[teacherId].studentsCount += c.students.filter(s => s.isActive !== false).length;
      byTeacher[teacherId].commissions.push(c);
      if (c.class) byTeacher[teacherId].classes.add(c.class.name);
    });

    // إحصائيات عامة
    const summary = {
      totalCommissions: commissions.length,
      totalAmount: commissions.reduce((sum, c) => sum + c.totalAmount, 0),
      totalPaid: commissions.reduce((sum, c) => sum + c.totalPaid, 0),
      totalRemaining: commissions.reduce((sum, c) => sum + c.remainingAmount, 0),
      totalTeachers: Object.keys(byTeacher).length,
      totalStudents: commissions.reduce((sum, c) => sum + c.students.filter(s => s.isActive !== false).length, 0)
    };

    // إرجاع الاستجابة بنفس تنسيق الواجهة الحالية
    res.json({
      success: true,
      month: month,
      summary: summary,
      byTeacher: Object.values(byTeacher).map(t => ({
        ...t,
        classesCount: t.classes.size,
        classes: undefined
      })),
      data: commissions
    });

  } catch (err) {
    console.error('❌ خطأ في جلب العمولات المستحقة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
  // في server.js

  // ==============================================
// ✅ نقطة نهاية لجلب تفاصيل عمولة أستاذ مع تفاصيل الطلاب
// ==============================================
app.get('/api/accounting/teacher-commissions/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`📊 جلب تفاصيل العمولة: ${id}`);
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'معرف العمولة غير صالح'
      });
    }

    const commission = await TeacherCommission.findById(id)
      .populate('teacher', 'name phone email salaryPercentage')
      .populate('class', 'name subject price paymentSystem')
      .populate('students.student', 'name studentId parentPhone academicYear')
      .populate('recordedBy', 'username fullName');

    if (!commission) {
      return res.status(404).json({
        success: false,
        error: 'العمولة غير موجودة'
      });
    }

    console.log(`✅ تم العثور على العمولة: ${commission._id}`);

    // جلب المدفوعات المرتبطة بهذه العمولة
    const payments = await Payment.find({
      commissionId: commission._id
    }).populate('student', 'name studentId');

    // جلب الحضور لكل طالب في الشهر المحدد
    const month = commission.month;
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);
    endDate.setHours(23, 59, 59, 999);

    console.log(`📅 الفترة: ${startDate} - ${endDate}`);

    // جلب الحصص الحية لهذه الحصة في الشهر
    const liveClasses = await LiveClass.find({
      class: commission.class._id,
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ['scheduled', 'ongoing', 'completed'] }
    }).sort({ date: 1 });

    console.log(`📚 عدد الحصص الحية في الشهر: ${liveClasses.length}`);
    const totalSessions = liveClasses.length;

    // بناء بيانات الطلاب مع الحضور والمدفوعات
    const studentsDetails = await Promise.all(
      commission.students.map(async (studentData) => {
        const student = studentData.student;
        
        if (!student) {
          return null;
        }
        
        // حساب المدفوعات
        const studentPayments = payments.filter(p => 
          p.student && p.student._id && p.student._id.toString() === student._id.toString()
        );
        
        const totalPaid = studentPayments
          .filter(p => p.status === 'paid')
          .reduce((sum, p) => sum + p.amount, 0);
        
        const totalPending = studentPayments
          .filter(p => p.status === 'pending' || p.status === 'late')
          .reduce((sum, p) => sum + p.amount, 0);
        
        const totalAmount = studentPayments.reduce((sum, p) => sum + p.amount, 0);
        
        // حساب الحضور لكل يوم
        const attendanceByDate = {};
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;
        
        liveClasses.forEach(lc => {
          const dateStr = lc.date.toISOString().split('T')[0];
          const attendanceRecord = lc.attendance.find(
            att => att.student && att.student.toString() === student._id.toString()
          );
          
          const status = attendanceRecord?.status || 'absent';
          attendanceByDate[dateStr] = {
            status: status,
            joinedAt: attendanceRecord?.joinedAt,
            startTime: lc.startTime
          };
          
          if (status === 'present') presentCount++;
          else if (status === 'late') lateCount++;
          else if (status === 'absent') absentCount++;
        });

        return {
          _id: student._id,
          name: student.name || 'غير معروف',
          studentId: student.studentId || 'غير معروف',
          academicYear: student.academicYear || 'غير محدد',
          parentPhone: student.parentPhone || '',
          teacherShare: studentData.teacherShare || 0,
          status: studentData.status || 'pending',
          paymentDate: studentData.paymentDate,
          isActive: studentData.isActive !== false,
          // ✅ عرض الحضور كعدد الحصص الحاضرة / الإجمالية
          attendanceDisplay: `${presentCount}/${totalSessions}`,
          attendanceCount: presentCount,
          totalSessions: totalSessions,
          payment: {
            totalAmount,
            totalPaid,
            totalPending,
            status: totalPaid >= totalAmount ? 'paid' : totalPaid > 0 ? 'partial' : 'pending',
            payments: studentPayments
          },
          attendance: {
            byDate: attendanceByDate,
            summary: {
              present: presentCount,
              absent: absentCount,
              late: lateCount,
              total: totalSessions,
              attendanceRate: totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0
            }
          },
          canEditPayment: true,
          canEditTeacherShare: true
        };
      })
    );

    // تصفية الطلاب الذين تم جلبهم بنجاح
    const validStudents = studentsDetails.filter(s => s !== null);

    // أيام الحصص القادمة
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingDays = [];
    const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    // جلب جدول الحصة
    const classObj = await Class.findById(commission.class._id);
    const scheduleDays = classObj?.schedule?.map(s => s.day) || [];
    
    // توليد الأيام القادمة (30 يوم)
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayName = daysOfWeek[date.getDay()];
      
      if (scheduleDays.includes(dayName)) {
        const dateStr = date.toISOString().split('T')[0];
        const hasClass = liveClasses.some(lc => 
          lc.date.toISOString().split('T')[0] === dateStr
        );
        
        upcomingDays.push({
          date: dateStr,
          dayName: dayName,
          hasClass: true,
          isPast: date < today,
          isToday: date.getTime() === today.getTime(),
          schedule: classObj?.schedule?.find(s => s.day === dayName) || null
        });
      }
    }

    // إحصائيات عامة
    const summary = {
      totalStudents: validStudents.length,
      totalPaid: validStudents.reduce((sum, s) => sum + s.payment.totalPaid, 0),
      totalPending: validStudents.reduce((sum, s) => sum + s.payment.totalPending, 0),
      totalAmount: validStudents.reduce((sum, s) => sum + s.payment.totalAmount, 0),
      totalTeacherShare: validStudents.reduce((sum, s) => sum + (s.teacherShare || 0), 0),
      totalPresent: validStudents.reduce((sum, s) => sum + s.attendance.summary.present, 0),
      totalAbsent: validStudents.reduce((sum, s) => sum + s.attendance.summary.absent, 0),
      totalLate: validStudents.reduce((sum, s) => sum + s.attendance.summary.late, 0),
      averageAttendance: validStudents.length > 0 
        ? Math.round(validStudents.reduce((sum, s) => sum + s.attendance.summary.attendanceRate, 0) / validStudents.length)
        : 0,
      // ✅ إضافة إحصائيات عدد الحصص
      totalSessions: totalSessions
    };

    // إرجاع الاستجابة
    res.json({
      success: true,
      data: {
        commission: {
          _id: commission._id,
          teacher: commission.teacher,
          class: commission.class,
          month: commission.month,
          totalAmount: commission.totalAmount,
          totalPaid: commission.totalPaid,
          remainingAmount: commission.remainingAmount,
          percentage: commission.percentage || 70,
          status: commission.status,
          paymentHistory: commission.paymentHistory || [],
          notes: commission.notes || '',
          createdAt: commission.createdAt
        },
        period: {
          start: startDate,
          end: endDate,
          month: month
        },
        summary,
        upcomingDays: upcomingDays.slice(0, 15),
        liveClasses: liveClasses.map(lc => ({
          _id: lc._id,
          date: lc.date,
          startTime: lc.startTime,
          status: lc.status,
          attendanceCount: lc.attendance?.length || 0
        })),
        students: validStudents
      }
    });

  } catch (err) {
    console.error('❌ خطأ في جلب تفاصيل العمولة:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});
// ==============================================
// ✅ نقطة نهاية لإلغاء العمولة (محسنة)
// ==============================================
app.put('/api/accounting/teacher-commissions/:id/cancel-enhanced', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, updatePayments = true } = req.body;

    const commission = await TeacherCommission.findById(id)
      .populate('teacher', 'name')
      .populate('class', 'name');

    if (!commission) {
      return res.status(404).json({ success: false, error: 'العمولة غير موجودة' });
    }

    // منع إلغاء عمولة مدفوعة بالكامل
    if (commission.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'لا يمكن إلغاء عمولة مدفوعة بالكامل'
      });
    }

    // تحديث حالة العمولة
    commission.status = 'cancelled';
    commission.remainingAmount = 0;
    commission.notes = commission.notes 
      ? `${commission.notes} | إلغاء: ${reason || 'تم الإلغاء من قبل المستخدم'}` 
      : `إلغاء: ${reason || 'تم الإلغاء من قبل المستخدم'}`;
    await commission.save();

    // تحديث الدفعات المرتبطة (اختياري)
    let paymentsUpdated = 0;
    if (updatePayments) {
      const result = await Payment.updateMany(
        {
          commissionId: id,
          status: { $in: ['pending', 'partial'] }
        },
        { 
          status: 'cancelled',
          notes: `إلغاء بسبب إلغاء العمولة: ${reason || ''}`
        }
      );
      paymentsUpdated = result.modifiedCount;
    }

    // تسجيل معاملة مالية استرداد (إذا كانت هناك مبالغ مدفوعة)
    let refundTransaction = null;
    if (commission.totalPaid > 0) {
      refundTransaction = new FinancialTransaction({
        schoolId: commission.schoolId,
        type: 'refund',
        amount: commission.totalPaid,
        description: `استرداد مبلغ العمولة الملغاة للأستاذ ${commission.teacher?.name || 'غير معروف'} - ${commission.month}`,
        category: 'refund',
        date: new Date(),
        reference: commission._id,
        recordedBy: req.user?.id || null
      });
      await refundTransaction.save();
    }

    res.json({
      success: true,
      message: 'تم إلغاء العمولة بنجاح',
      data: {
        commissionId: commission._id,
        status: commission.status,
        remainingAmount: commission.remainingAmount,
        paymentsUpdated: paymentsUpdated,
        refundTransaction: refundTransaction ? refundTransaction._id : null
      }
    });

  } catch (err) {
    console.error('❌ خطأ في إلغاء العمولة:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================
// ✅ GET /api/accounting/transactions-status - Get transactions by status
// ==============================================
app.get('/api/accounting/transactions-status', async (req, res) => {
  try {
    const { schoolId, month, status, type } = req.query;

    console.log('📊 Fetching transactions by status:', { schoolId, month, status });

    // ✅ Validate schoolId
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف المدرسة غير صالح'
      });
    }

    // ✅ Check if school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'المدرسة غير موجودة'
      });
    }

    // ✅ Build date filter for the month
    let dateFilter = {};
    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0);
      endDate.setHours(23, 59, 59, 999);
      dateFilter = { $gte: startDate, $lte: endDate };
    }

    // ==============================================
    // 1. Get Payments by status
    // ==============================================
    const paymentQuery = { schoolId: schoolId };
    if (month) {
      paymentQuery.monthCode = month;
    }
    if (status && status !== 'all') {
      paymentQuery.status = status;
    }

    const payments = await Payment.find(paymentQuery)
      .populate('student', 'name studentId')
      .populate('class', 'name subject')
      .populate('recordedBy', 'username fullName')
      .sort({ createdAt: -1 });

    // ==============================================
    // 2. Get School Fees by status
    // ==============================================
    const feeQuery = { schoolId: schoolId };
    if (dateFilter.date) {
      feeQuery.paymentDate = dateFilter;
    } else if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0);
      endDate.setHours(23, 59, 59, 999);
      feeQuery.paymentDate = { $gte: startDate, $lte: endDate };
    }
    if (status && status !== 'all') {
      feeQuery.status = status;
    }

    const fees = await SchoolFee.find(feeQuery)
      .populate('student', 'name studentId')
      .populate('recordedBy', 'username fullName')
      .sort({ paymentDate: -1 });

    // ==============================================
    // 3. Get Expenses by status
    // ==============================================
    const expenseQuery = { schoolId: schoolId };
    if (dateFilter.date) {
      expenseQuery.date = dateFilter;
    } else if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0);
      endDate.setHours(23, 59, 59, 999);
      expenseQuery.date = { $gte: startDate, $lte: endDate };
    }
    if (status && status !== 'all') {
      expenseQuery.status = status;
    }

    const expenses = await Expense.find(expenseQuery)
      .populate('recordedBy', 'username fullName')
      .sort({ date: -1 });

    // ==============================================
    // 4. Get Financial Transactions by type/status
    // ==============================================
    const transactionQuery = { schoolId: schoolId };
    if (dateFilter.date) {
      transactionQuery.date = dateFilter;
    } else if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0);
      endDate.setHours(23, 59, 59, 999);
      transactionQuery.date = { $gte: startDate, $lte: endDate };
    }
    if (type) {
      transactionQuery.type = type;
    }

    const transactions = await FinancialTransaction.find(transactionQuery)
      .populate('recordedBy', 'username fullName')
      .populate('student', 'name studentId')
      .sort({ date: -1 });

    // ==============================================
    // 5. Get Teacher Commissions by status
    // ==============================================
    const commissionQuery = { schoolId: schoolId };
    if (month) {
      commissionQuery.month = month;
    }
    if (status && status !== 'all') {
      commissionQuery.status = status;
    }

    const commissions = await TeacherCommission.find(commissionQuery)
      .populate('teacher', 'name')
      .populate('class', 'name subject')
      .populate('recordedBy', 'username fullName')
      .sort({ createdAt: -1 });

    // ==============================================
    // 6. Combine all transactions with type labels
    // ==============================================
    const allTransactions = [];

    // Add payments
    payments.forEach(p => {
      allTransactions.push({
        _id: p._id,
        _type: 'payment',
        typeLabel: 'دفعة طالب',
        amount: p.amount,
        status: p.status,
        description: `دفعة من ${p.student?.name || 'طالب'} - ${p.month || ''}`,
        date: p.paymentDate || p.createdAt,
        month: p.month,
        monthCode: p.monthCode,
        student: p.student,
        class: p.class,
        recordedBy: p.recordedBy,
        icon: '💰'
      });
    });

    // Add fees
    fees.forEach(f => {
      allTransactions.push({
        _id: f._id,
        _type: 'registration_fee',
        typeLabel: 'رسوم تسجيل',
        amount: f.amount,
        status: f.status,
        description: `رسوم تسجيل ${f.student?.name || 'طالب'}`,
        date: f.paymentDate || f.createdAt,
        student: f.student,
        recordedBy: f.recordedBy,
        icon: '📋'
      });
    });

    // Add expenses
    expenses.forEach(e => {
      allTransactions.push({
        _id: e._id,
        _type: 'expense',
        typeLabel: 'مصروف',
        amount: e.amount,
        status: e.status,
        description: e.description,
        date: e.date || e.createdAt,
        category: e.category,
        recordedBy: e.recordedBy,
        icon: '📉'
      });
    });

    // Add financial transactions
    transactions.forEach(t => {
      allTransactions.push({
        _id: t._id,
        _type: 'financial_transaction',
        typeLabel: t.type === 'income' ? 'معاملة دخل' : 'معاملة مصروف',
        amount: t.amount,
        status: t.status || 'completed',
        description: t.description,
        date: t.date || t.createdAt,
        category: t.category,
        type: t.type,
        recordedBy: t.recordedBy,
        icon: t.type === 'income' ? '📈' : '📉'
      });
    });

    // Add commissions
    commissions.forEach(c => {
      allTransactions.push({
        _id: c._id,
        _type: 'commission',
        typeLabel: 'عمولة أستاذ',
        amount: c.totalAmount,
        status: c.status,
        description: `عمولة ${c.teacher?.name || 'أستاذ'} - ${c.class?.name || 'حصة'}`,
        date: c.createdAt,
        month: c.month,
        teacher: c.teacher,
        class: c.class,
        recordedBy: c.recordedBy,
        icon: '👨‍🏫'
      });
    });

    // ==============================================
    // 7. Filter by status if provided
    // ==============================================
    let filteredTransactions = allTransactions;
    if (status && status !== 'all') {
      filteredTransactions = allTransactions.filter(t => t.status === status);
    }

    // ==============================================
    // 8. Calculate statistics
    // ==============================================
    const stats = {
      total: filteredTransactions.length,
      totalAmount: filteredTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
      byStatus: {
        paid: filteredTransactions.filter(t => t.status === 'paid' || t.status === 'completed').length,
        pending: filteredTransactions.filter(t => t.status === 'pending').length,
        cancelled: filteredTransactions.filter(t => t.status === 'cancelled').length,
        partial: filteredTransactions.filter(t => t.status === 'partial').length,
        late: filteredTransactions.filter(t => t.status === 'late').length
      },
      byType: {
        payments: filteredTransactions.filter(t => t._type === 'payment').length,
        fees: filteredTransactions.filter(t => t._type === 'registration_fee').length,
        expenses: filteredTransactions.filter(t => t._type === 'expense').length,
        commissions: filteredTransactions.filter(t => t._type === 'commission').length,
        financialTransactions: filteredTransactions.filter(t => t._type === 'financial_transaction').length
      }
    };

    // ==============================================
    // 9. Return response
    // ==============================================
    res.json({
      success: true,
      month: month || 'all',
      status: status || 'all',
      school: {
        _id: school._id,
        name: school.name,
        schoolKey: school.schoolKey
      },
      stats: stats,
      transactions: filteredTransactions.sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
      }),
      summary: {
        totalTransactions: filteredTransactions.length,
        totalPaid: filteredTransactions.filter(t => t.status === 'paid').reduce((sum, t) => sum + (t.amount || 0), 0),
        totalPending: filteredTransactions.filter(t => t.status === 'pending').reduce((sum, t) => sum + (t.amount || 0), 0),
        totalCancelled: filteredTransactions.filter(t => t.status === 'cancelled').reduce((sum, t) => sum + (t.amount || 0), 0)
      }
    });

  } catch (err) {
    console.error('❌ Error in transactions-status:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ==============================================
// ✅ نقطة نهاية لتحديث نسبة العمولة فقط (بدون دفع)
// ==============================================
app.put('/api/accounting/teacher-commissions/:id/update-percentage', async (req, res) => {
  try {
    const { id } = req.params;
    const { percentage, applyToAllStudents = true } = req.body;

    if (!percentage || percentage < 0 || percentage > 100) {
      return res.status(400).json({
        success: false,
        error: 'النسبة يجب أن تكون بين 0 و 100'
      });
    }

    const commission = await TeacherCommission.findById(id);
    if (!commission) {
      return res.status(404).json({ success: false, error: 'العمولة غير موجودة' });
    }

    // تحديث نسبة العمولة
    commission.percentage = percentage;

    if (applyToAllStudents && commission.students.length > 0) {
      // إعادة حساب حصة كل طالب بناءً على النسبة الجديدة
      let totalAmount = 0;
      for (const student of commission.students) {
        // الحصول على المبلغ الأساسي للطالب (من الدفعات)
        const payments = await Payment.find({
          student: student.student,
          class: commission.class,
          monthCode: commission.month
        });
        const baseAmount = payments.reduce((sum, p) => sum + p.amount, 0) || 0;
        const teacherShare = Math.round((baseAmount * percentage) / 100);
        student.teacherShare = teacherShare;
        totalAmount += teacherShare;
      }
      
      commission.totalAmount = totalAmount;
      commission.remainingAmount = totalAmount - commission.totalPaid;
    }

    // تحديث الحالة إذا كان المبلغ المتبقي صفر
    if (commission.remainingAmount <= 0 && commission.totalPaid > 0) {
      commission.status = 'paid';
    } else if (commission.totalPaid > 0) {
      commission.status = 'partial';
    } else {
      commission.status = 'pending';
    }

    await commission.save();

    res.json({
      success: true,
      message: `تم تحديث نسبة العمولة إلى ${percentage}% بنجاح`,
      data: {
        commissionId: commission._id,
        percentage: commission.percentage,
        totalAmount: commission.totalAmount,
        remainingAmount: commission.remainingAmount,
        status: commission.status
      }
    });

  } catch (err) {
    console.error('❌ خطأ في تحديث نسبة العمولة:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// ==============================================
// ✅ نقطة نهاية موحدة لإحصائيات العمولة
// ==============================================
app.get('/api/accounting/commission-summary', async (req, res) => {
  try {
    const { schoolId, month, teacherId } = req.query;
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    const filter = { schoolId: schoolId };
    if (month) filter.month = month;
    if (teacherId) filter.teacher = teacherId;

    // 1. إحصائيات عامة
    const stats = await TeacherCommission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$totalPaid' },
          totalRemaining: { $sum: '$remainingAmount' },
          studentsCount: { $sum: { $size: '$students' } }
        }
      }
    ]);

    // 2. إجمالي المبالغ
    const totals = await TeacherCommission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$totalPaid' },
          totalRemaining: { $sum: '$remainingAmount' },
          count: { $sum: 1 },
          totalStudents: { $sum: { $size: '$students' } }
        }
      }
    ]);

    // 3. العمولات حسب الشهر
    const byMonth = await TeacherCommission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$month',
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$totalPaid' },
          totalRemaining: { $sum: '$remainingAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // 4. العمولات حسب الأستاذ
    const byTeacher = await TeacherCommission.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$teacher',
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$totalPaid' },
          totalRemaining: { $sum: '$remainingAmount' },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'teachers',
          localField: '_id',
          foreignField: '_id',
          as: 'teacher'
        }
      },
      {
        $project: {
          teacher: { $arrayElemAt: ['$teacher', 0] },
          totalAmount: 1,
          totalPaid: 1,
          totalRemaining: 1,
          count: 1
        }
      }
    ]);

    // بناء الاستجابة
    const statusSummary = {
      pending: { count: 0, amount: 0, paid: 0, remaining: 0, students: 0 },
      partial: { count: 0, amount: 0, paid: 0, remaining: 0, students: 0 },
      paid: { count: 0, amount: 0, paid: 0, remaining: 0, students: 0 },
      cancelled: { count: 0, amount: 0, paid: 0, remaining: 0, students: 0 }
    };

    stats.forEach(stat => {
      if (stat._id && statusSummary[stat._id]) {
        statusSummary[stat._id] = {
          count: stat.count || 0,
          amount: stat.totalAmount || 0,
          paid: stat.totalPaid || 0,
          remaining: stat.totalRemaining || 0,
          students: stat.studentsCount || 0
        };
      }
    });

    res.json({
      success: true,
      summary: {
        byStatus: statusSummary,
        total: totals[0] || { totalAmount: 0, totalPaid: 0, totalRemaining: 0, count: 0, totalStudents: 0 },
        byMonth: byMonth,
        byTeacher: byTeacher
      }
    });

  } catch (err) {
    console.error('❌ خطأ في جلب ملخص العمولات:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// ==============================================
// ✅ نقطة نهاية لتحديث حصة الطالب في العمولة
// ==============================================
app.put('/api/accounting/teacher-commissions/:id/student-share', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, teacherShare, reason } = req.body;

    console.log(`✏️ تحديث حصة الطالب ${studentId} في العمولة ${id}`);

    if (!studentId || teacherShare === undefined || teacherShare < 0) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد الطالب والمبلغ الجديد'
      });
    }

    // التحقق من صحة المعرفات
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف غير صالح'
      });
    }

    const commission = await TeacherCommission.findById(id);
    if (!commission) {
      return res.status(404).json({ success: false, error: 'العمولة غير موجودة' });
    }

    // البحث عن الطالب في العمولة
    const studentIndex = commission.students.findIndex(
      s => s.student.toString() === studentId
    );

    if (studentIndex === -1) {
      return res.status(404).json({ success: false, error: 'الطالب غير موجود في هذه العمولة' });
    }

    // تخزين المبلغ القديم
    const oldShare = commission.students[studentIndex].teacherShare || 0;
    
    // تحديث المبلغ
    commission.students[studentIndex].teacherShare = teacherShare;
    
    // إضافة ملاحظة التعديل
    if (reason) {
      commission.notes = commission.notes 
        ? `${commission.notes} | تعديل حصة الطالب: ${reason}` 
        : `تعديل حصة الطالب: ${reason}`;
    }

    // إعادة حساب المبلغ الإجمالي للعمولة
    let totalAmount = 0;
    commission.students.forEach(s => {
      if (s.isActive !== false) {
        totalAmount += (s.teacherShare || 0);
      }
    });
    
    commission.totalAmount = totalAmount;
    commission.remainingAmount = totalAmount - commission.totalPaid;
    
    // تحديث الحالة
    if (commission.remainingAmount <= 0) {
      commission.status = 'paid';
    } else if (commission.totalPaid > 0) {
      commission.status = 'partial';
    } else {
      commission.status = 'pending';
    }
    
    await commission.save();

    res.json({
      success: true,
      message: `تم تحديث حصة الطالب من ${oldShare} إلى ${teacherShare} د.ج`,
      data: {
        studentId,
        oldShare,
        newShare: teacherShare,
        totalAmount: commission.totalAmount,
        remainingAmount: commission.remainingAmount,
        status: commission.status
      }
    });

  } catch (err) {
    console.error('❌ خطأ في تحديث حصة الطالب:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});


// ==============================================
// 🔧 FIX CLASS - إصلاح بيانات حصة قديمة
// ==============================================
app.post('/api/classes/:id/fix', async (req, res) => {
  try {
    const classId = req.params.id;
    const schoolId = req.user?.schoolId || req.body.schoolId;
    
    console.log(`🔧 إصلاح الحصة: ${classId}`);
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الحصة غير صالح'
      });
    }

    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({
        success: false,
        error: 'الحصة غير موجودة'
      });
    }

    // ✅ إضافة schoolId إذا كان مفقوداً
    let fixed = false;
    if (!classObj.schoolId && schoolId) {
      classObj.schoolId = schoolId;
      fixed = true;
      console.log(`✅ تم إضافة schoolId إلى الحصة: ${classObj.name}`);
    }

    // ✅ التأكد من أن paymentSystem له قيمة صحيحة
    if (!classObj.paymentSystem || !['monthly', 'rounds'].includes(classObj.paymentSystem)) {
      classObj.paymentSystem = 'monthly';
      fixed = true;
      console.log(`✅ تم إصلاح نظام الدفع للحصة: ${classObj.name}`);
    }

    // ✅ التأكد من وجود roundSettings
    if (!classObj.roundSettings) {
      classObj.roundSettings = {
        sessionCount: 8,
        sessionDuration: 2,
        breakBetweenSessions: 0
      };
      fixed = true;
      console.log(`✅ تم إضافة roundSettings للحصة: ${classObj.name}`);
    }

    if (fixed) {
      await classObj.save();
      console.log(`✅ تم إصلاح الحصة: ${classObj.name}`);
    } else {
      console.log(`ℹ️ الحصة سليمة: ${classObj.name}`);
    }

    res.json({
      success: true,
      message: fixed ? 'تم إصلاح الحصة بنجاح' : 'الحصة سليمة ولا تحتاج لإصلاح',
      fixed: fixed,
      class: classObj
    });

  } catch (err) {
    console.error('❌ خطأ في إصلاح الحصة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
// ==============================================
// ✅ إزالة طالب من حصة (مع حذف المدفوعات المعلقة)
// ==============================================
app.post('/api/students/:studentId/unenroll-multiple', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { classIds, schoolId } = req.body;
    
    console.log(`🗑️ إزالة الطالب ${studentId} من الحصص:`, classIds);
    console.log(`🏫 schoolId: ${schoolId}`);
    
    // التحقق من صحة المعرف
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الطالب غير صالح'
      });
    }

    // جلب الطالب
    const student = await Student.findOne({
      _id: studentId,
      ...(schoolId && { schoolId: schoolId })
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'الطالب غير موجود'
      });
    }

    const results = {
      removedFromClasses: 0,
      paymentsDeleted: 0,
      failed: 0,
      details: []
    };

    // إذا لم يتم تحديد classIds، استخدم جميع حصص الطالب
    const classIdsToRemove = classIds || student.classes || [];

    if (classIdsToRemove.length === 0) {
      return res.json({
        success: true,
        message: 'الطالب ليس مسجلاً في أي حصة',
        results: results
      });
    }

    // معالجة كل حصة
    for (const classId of classIdsToRemove) {
      try {
        // التحقق من صحة المعرف
        if (!mongoose.Types.ObjectId.isValid(classId)) {
          results.failed++;
          results.details.push({
            classId,
            error: 'معرف الحصة غير صالح',
            status: 'failed'
          });
          continue;
        }

        // التحقق من وجود الحصة
        const classObj = await Class.findOne({
          _id: classId,
          ...(schoolId && { schoolId: schoolId })
        });

        if (!classObj) {
          results.failed++;
          results.details.push({
            classId,
            error: 'الحصة غير موجودة',
            status: 'failed'
          });
          continue;
        }

        // 1. إزالة الطالب من الحصة
        const updateResult = await Class.updateOne(
          { _id: classId },
          { $pull: { students: studentId } }
        );

        if (updateResult.modifiedCount > 0) {
          results.removedFromClasses++;
          results.details.push({
            classId,
            className: classObj.name,
            status: 'removed_from_class',
            studentsCount: classObj.students.length
          });
        }

        // 2. حذف جميع المدفوعات المعلقة للطالب في هذه الحصة
        const paymentResult = await Payment.deleteMany({
          student: studentId,
          class: classId,
          status: { $in: ['pending', 'late'] }
        });

        results.paymentsDeleted += paymentResult.deletedCount || 0;

        // 3. حذف الدفعات المعلقة في Payment Schema أيضاً (للتأكد)
        const paymentResult2 = await Payment.deleteMany({
          student: studentId,
          class: classId,
          status: { $in: ['pending', 'late'] }
        });

        results.paymentsDeleted += paymentResult2.deletedCount || 0;

        // 4. تحديث العمولات المرتبطة (إذا وجدت)
        const commissions = await TeacherCommission.find({
          schoolId: schoolId,
          class: classId,
          month: { $exists: true }
        });

        for (const commission of commissions) {
          // إزالة الطالب من العمولة
          const studentIndex = commission.students.findIndex(
            s => s.student.toString() === studentId
          );

          if (studentIndex !== -1) {
            // إلغاء حصة الطالب في العمولة
            commission.students[studentIndex].status = 'cancelled';
            commission.students[studentIndex].isActive = false;
            
            // إعادة حساب المبالغ
            commission.totalAmount = commission.students
              .filter(s => s.isActive !== false)
              .reduce((sum, s) => sum + (s.teacherShare || 0), 0);
            
            commission.remainingAmount = commission.totalAmount - commission.totalPaid;
            
            if (commission.remainingAmount <= 0) {
              commission.status = 'paid';
            } else if (commission.totalPaid > 0) {
              commission.status = 'partial';
            }
            
            await commission.save();
          }
        }

        // 5. تحديث الدفعات المرتبطة بالعمولة (تحديث حالتها إلى cancelled)
        await Payment.updateMany(
          {
            student: studentId,
            class: classId,
            commissionId: { $exists: true }
          },
          { status: 'cancelled' }
        );

        results.details.push({
          classId,
          className: classObj.name,
          paymentsDeleted: paymentResult.deletedCount || 0,
          status: 'completed'
        });

      } catch (err) {
        console.error(`❌ خطأ في معالجة الحصة ${classId}:`, err);
        results.failed++;
        results.details.push({
          classId,
          error: err.message,
          status: 'failed'
        });
      }
    }

    // 6. إزالة الحصص من قائمة الطالب
    if (classIdsToRemove.length > 0) {
      await Student.updateOne(
        { _id: studentId },
        { $pull: { classes: { $in: classIdsToRemove } } }
      );
    }

    // 7. تسجيل عملية الإزالة في السجل (اختياري)
    try {
      const logMessage = new Message({
        sender: req.user?.id || null,
        recipients: [{ student: studentId }],
        content: `تم إزالة الطالب ${student.name} من ${results.removedFromClasses} حصة وحذف ${results.paymentsDeleted} دفعة معلقة`,
        messageType: 'system',
        status: 'sent'
      });
      await logMessage.save({ validateBeforeSave: false });
    } catch (logErr) {
      console.warn('⚠️ فشل في تسجيل سجل الإزالة:', logErr.message);
    }

    // جلب البيانات المحدثة للطالب
    const updatedStudent = await Student.findById(studentId)
      .populate('classes', 'name subject');

    res.json({
      success: true,
      message: `تم إزالة الطالب من ${results.removedFromClasses} حصة وحذف ${results.paymentsDeleted} دفعة معلقة`,
      results: results,
      student: {
        _id: updatedStudent._id,
        name: updatedStudent.name,
        studentId: updatedStudent.studentId,
        classes: updatedStudent.classes || []
      }
    });

  } catch (err) {
    console.error('❌ خطأ في إزالة الطالب:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ==============================================
// ✅ نقطة نهاية بديلة لإزالة الطالب (DELETE)
// ==============================================
app.delete('/api/students/:studentId/unenroll/:classId', async (req, res) => {
  try {
    const { studentId, classId } = req.params;
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    console.log(`🗑️ إزالة الطالب ${studentId} من الحصة ${classId}`);
    
    // التحقق من صحة المعرفات
    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف غير صالح'
      });
    }

    // التحقق من وجود الطالب
    const student = await Student.findOne({
      _id: studentId,
      ...(schoolId && { schoolId: schoolId })
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'الطالب غير موجود'
      });
    }

    // التحقق من وجود الحصة
    const classObj = await Class.findOne({
      _id: classId,
      ...(schoolId && { schoolId: schoolId })
    });

    if (!classObj) {
      return res.status(404).json({
        success: false,
        error: 'الحصة غير موجودة'
      });
    }

    // إزالة الطالب من الحصة
    await Class.updateOne(
      { _id: classId },
      { $pull: { students: studentId } }
    );

    // إزالة الحصة من الطالب
    await Student.updateOne(
      { _id: studentId },
      { $pull: { classes: classId } }
    );

    // حذف المدفوعات المعلقة
    const deletedPayments = await Payment.deleteMany({
      student: studentId,
      class: classId,
      status: { $in: ['pending', 'late'] }
    });

    // حذف المدفوعات المرتبطة بالعمولة
    await Payment.updateMany(
      {
        student: studentId,
        class: classId,
        commissionId: { $exists: true }
      },
      { status: 'cancelled' }
    );

    // تحديث العمولات
    const commissions = await TeacherCommission.find({
      schoolId: schoolId,
      class: classId
    });

    for (const commission of commissions) {
      const studentIndex = commission.students.findIndex(
        s => s.student.toString() === studentId
      );
      if (studentIndex !== -1) {
        commission.students[studentIndex].status = 'cancelled';
        commission.students[studentIndex].isActive = false;
        commission.totalAmount = commission.students
          .filter(s => s.isActive !== false)
          .reduce((sum, s) => sum + (s.teacherShare || 0), 0);
        commission.remainingAmount = commission.totalAmount - commission.totalPaid;
        await commission.save();
      }
    }

    res.json({
      success: true,
      message: `تم إزالة الطالب من الحصة ${classObj.name} وحذف ${deletedPayments.deletedCount || 0} دفعة معلقة`,
      deletedPaymentsCount: deletedPayments.deletedCount || 0
    });

  } catch (err) {
    console.error('❌ خطأ في إزالة الطالب:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
// ==============================================
// 🔧 FIX ALL CLASSES - إصلاح جميع حصص المدرسة
// ==============================================
app.post('/api/classes/fix-all', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    console.log(`🔧 إصلاح جميع حصص المدرسة: ${schoolId}`);

    const classes = await Class.find({ schoolId: schoolId });
    let fixedCount = 0;

    for (const classObj of classes) {
      let fixed = false;
      
      if (!classObj.paymentSystem || !['monthly', 'rounds'].includes(classObj.paymentSystem)) {
        classObj.paymentSystem = 'monthly';
        fixed = true;
      }

      if (!classObj.roundSettings) {
        classObj.roundSettings = {
          sessionCount: 8,
          sessionDuration: 2,
          breakBetweenSessions: 0
        };
        fixed = true;
      }

      if (fixed) {
        await classObj.save();
        fixedCount++;
        console.log(`✅ تم إصلاح الحصة: ${classObj.name}`);
      }
    }

    res.json({
      success: true,
      message: `تم إصلاح ${fixedCount} حصة من أصل ${classes.length}`,
      total: classes.length,
      fixed: fixedCount
    });

  } catch (err) {
    console.error('❌ خطأ في إصلاح جميع الحصص:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});




// ==============================================
// ✅ نقطة نهاية لتحديث حضور طالب في يوم معين للعمولة
// ==============================================
app.put('/api/accounting/teacher-commissions/:id/attendance', async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, date, status } = req.body;

    console.log(`📝 تحديث حضور الطالب ${studentId} في التاريخ ${date} للعمولة ${id}`);

    if (!studentId || !date || !status) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد الطالب والتاريخ والحالة'
      });
    }

    // التحقق من صحة المعرفات
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف غير صالح'
      });
    }

    const commission = await TeacherCommission.findById(id)
      .populate('class', '_id');

    if (!commission) {
      return res.status(404).json({ success: false, error: 'العمولة غير موجودة' });
    }

    // البحث عن الحصة الحية في هذا التاريخ
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    let liveClass = await LiveClass.findOne({
      class: commission.class._id,
      date: { $gte: startDate, $lte: endDate }
    });

    // إذا لم توجد حصة حية، قم بإنشائها
    if (!liveClass) {
      const classObj = await Class.findById(commission.class._id)
        .populate('students', 'name studentId');
      
      if (!classObj) {
        return res.status(404).json({ success: false, error: 'الحصة غير موجودة' });
      }

      const attendance = classObj.students.map(student => ({
        student: student._id,
        status: 'absent',
        joinedAt: null,
        leftAt: null
      }));

      liveClass = new LiveClass({
        class: commission.class._id,
        date: startDate,
        startTime: '08:00',
        endTime: '10:00',
        teacher: commission.teacher,
        attendance: attendance,
        status: 'scheduled',
        month: startDate.toISOString().slice(0, 7)
      });
      await liveClass.save();
      console.log(`✅ تم إنشاء حصة حية جديدة: ${liveClass._id}`);
    }

    // تحديث حالة الطالب في الحصة الحية
    const attendanceIndex = liveClass.attendance.findIndex(
      att => att.student.toString() === studentId
    );

    if (attendanceIndex >= 0) {
      liveClass.attendance[attendanceIndex].status = status;
      if (status === 'present' || status === 'late') {
        liveClass.attendance[attendanceIndex].joinedAt = new Date();
      }
    } else {
      liveClass.attendance.push({
        student: studentId,
        status: status,
        joinedAt: status === 'present' || status === 'late' ? new Date() : null,
        leftAt: null
      });
    }

    await liveClass.save();
    console.log(`✅ تم تحديث حضور الطالب في الحصة الحية`);

    res.json({
      success: true,
      message: `تم تحديث حضور الطالب بنجاح`,
      data: {
        studentId,
        date,
        status,
        liveClassId: liveClass._id
      }
    });

  } catch (err) {
    console.error('❌ خطأ في تحديث الحضور:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================
// ✅ نقطة نهاية لجلب تفاصيل العمولة فقط (بدون تفاصيل الطلاب)
// ==============================================
app.get('/api/accounting/teacher-commissions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'معرف العمولة غير صالح'
      });
    }

    const commission = await TeacherCommission.findById(id)
      .populate('teacher', 'name phone email')
      .populate('class', 'name subject price')
      .populate('students.student', 'name studentId')
      .populate('recordedBy', 'username fullName');

    if (!commission) {
      return res.status(404).json({
        success: false,
        error: 'العمولة غير موجودة'
      });
    }

    res.json({
      success: true,
      data: commission
    });

  } catch (err) {
    console.error('❌ خطأ في جلب العمولة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// ✅ نقطة نهاية لجلب إحصائيات العمولات للشهر
// ==============================================
app.get('/api/accounting/teacher-commissions/stats', async (req, res) => {
  try {
    const { schoolId, month, teacherId } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    const matchStage = { schoolId: schoolId };
    if (month) matchStage.month = month;
    if (teacherId) matchStage.teacher = teacherId;

    const stats = await TeacherCommission.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$totalPaid' },
          totalRemaining: { $sum: '$remainingAmount' },
          studentsCount: { $sum: { $size: '$students' } }
        }
      }
    ]);

    const result = {
      pending: { count: 0, amount: 0, paid: 0, remaining: 0, students: 0 },
      partial: { count: 0, amount: 0, paid: 0, remaining: 0, students: 0 },
      paid: { count: 0, amount: 0, paid: 0, remaining: 0, students: 0 },
      cancelled: { count: 0, amount: 0, paid: 0, remaining: 0, students: 0 }
    };

    stats.forEach(stat => {
      if (stat._id && result[stat._id]) {
        result[stat._id] = {
          count: stat.count || 0,
          amount: stat.totalAmount || 0,
          paid: stat.totalPaid || 0,
          remaining: stat.totalRemaining || 0,
          students: stat.studentsCount || 0
        };
      }
    });

    res.json({
      success: true,
      stats: result,
      total: {
        count: stats.reduce((sum, s) => sum + s.count, 0),
        amount: stats.reduce((sum, s) => sum + s.totalAmount, 0),
        paid: stats.reduce((sum, s) => sum + s.totalPaid, 0),
        remaining: stats.reduce((sum, s) => sum + s.totalRemaining, 0),
        students: stats.reduce((sum, s) => sum + s.studentsCount, 0)
      }
    });

  } catch (err) {
    console.error('❌ خطأ في جلب إحصائيات العمولات:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
  
  // POST /api/accounting/teacher-commissions - Create new commission
  app.post('/api/accounting/teacher-commissions',  async (req, res) => {
    try {
      const { 
        teacherId, 
        studentId, 
        classId, 
        month, 
        round,
        amount, 
        percentage, 
        type,
        studentDetails,
        notes 
      } = req.body;
  
      // Validate required fields
      if (!teacherId || !classId || !month || !amount) {
        return res.status(400).json({ 
          success: false,
          error: 'البيانات ناقصة: يجب توفير teacherId, classId, month, amount' 
        });
      }
  
      // Check if teacher exists
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({ 
          success: false,
          error: 'الأستاذ غير موجود' 
        });
      }
  
      // Check if class exists
      const classObj = await Class.findById(classId);
      if (!classObj) {
        return res.status(404).json({ 
          success: false,
          error: 'الحصة غير موجودة' 
        });
      }
  
      // If student commission, check if student exists
      if (type === 'individual' && studentId) {
        const student = await Student.findById(studentId);
        if (!student) {
          return res.status(404).json({ 
            success: false,
            error: 'الطالب غير موجود' 
          });
        }
      }
  
      // Check for existing commission to avoid duplicates
      const existingCommission = await TeacherCommission.findOne({
        teacher: teacherId,
        class: classId,
        month: month,
        ...(type === 'individual' && { student: studentId }),
        type: type
      });
  
      if (existingCommission) {
        return res.status(400).json({ 
          success: false,
          error: 'تم تسجيل هذه العمولة مسبقاً',
          existingCommission 
        });
      }
  
      // Create new commission
      const commission = new TeacherCommission({
        teacher: teacherId,
        student: type === 'individual' ? studentId : null,
        class: classId,
        month: month,
        round: round || null,
        amount: amount,
        percentage: percentage || 70,
        type: type || 'individual',
        status: 'pending',
        recordedBy: req.user.id,
        notes: notes || '',
        studentDetails: studentDetails || []
      });
  
      await commission.save();
  
      // Populate for response
      await commission.populate('teacher', 'name');
      await commission.populate('student', 'name');
      await commission.populate('class', 'name subject');
  
      res.status(201).json({
        success: true,
        message: 'تم إنشاء العمولة بنجاح',
        data: commission
      });
  
    } catch (err) {
      console.error('Error creating commission:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });
  
  
  
  // POST /api/accounting/teacher-commissions/pay-single - Pay a single commission
  app.post('/api/accounting/teacher-commissions/pay-single',  async (req, res) => {
    try {
      const { commissionId, paymentMethod, paymentDate, notes } = req.body;
  
      if (!commissionId) {
        return res.status(400).json({ 
          success: false,
          error: 'معرف العمولة مطلوب' 
        });
      }
  
      // Find the commission
      const commission = await TeacherCommission.findById(commissionId)
        .populate('teacher')
        .populate('student')
        .populate('class');
  
      if (!commission) {
        return res.status(404).json({ 
          success: false,
          error: 'العمولة غير موجودة' 
        });
      }
  
      // Check if already paid
      if (commission.status === 'paid') {
        return res.status(400).json({ 
          success: false,
          error: 'العمولة مدفوعة مسبقاً' 
        });
      }
  
      // Update commission
      commission.status = 'paid';
      commission.paymentDate = paymentDate || new Date();
      commission.paymentMethod = paymentMethod || 'cash';
      commission.receiptNumber = `COMM-${Date.now()}`;
      commission.recordedBy = req.user.id;
      
      if (notes) {
        commission.notes = notes;
      }
  
      await commission.save();
  
      // Create expense record
      const expense = new Expense({
        description: `عمولة الأستاذ ${commission.teacher.name} ${commission.student ? `عن الطالب ${commission.student.name}` : ''} لحصة ${commission.class.name} لشهر ${commission.month}`,
        amount: commission.amount,
        category: 'salary',
        type: 'teacher_payment',
        recipient: {
          type: 'teacher',
          id: commission.teacher._id,
          name: commission.teacher.name
        },
        paymentMethod: commission.paymentMethod,
        receiptNumber: commission.receiptNumber,
        status: 'paid',
        recordedBy: req.user.id,
        notes: commission.notes || ''
      });
  
      await expense.save();
  
      // Create financial transaction
      const transaction = new FinancialTransaction({
        type: 'expense',
        amount: commission.amount,
        description: expense.description,
        category: 'salary',
        recordedBy: req.user.id,
        reference: commission._id,
        date: commission.paymentDate
      });
  
      await transaction.save();
  
      res.json({
        success: true,
        message: 'تم دفع العمولة بنجاح',
        data: {
          commission,
          expense: {
            _id: expense._id,
            receiptNumber: expense.receiptNumber
          },
          transaction: transaction._id
        }
      });
  
    } catch (err) {
      console.error('Error paying commission:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });
  
  
  
  // POST /api/accounting/teacher-commissions/pay-all - Pay all pending commissions for a month
  app.post('/api/accounting/teacher-commissions/pay-all',  async (req, res) => {
    try {
      const { month, paymentMethod, paymentDate, notes } = req.body;
  
      if (!month) {
        return res.status(400).json({ 
          success: false,
          error: 'الشهر مطلوب' 
        });
      }
  
      // Find all pending commissions for the month
      const commissions = await TeacherCommission.find({
        month: month,
        status: 'pending'
      }).populate('teacher').populate('student').populate('class');
  
      if (commissions.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'لا توجد عمولات معلقة لهذا الشهر' 
        });
      }
  
      const results = {
        total: commissions.length,
        paid: 0,
        failed: 0,
        totalAmount: 0,
        commissions: [],
        expenses: []
      };
  
      // Process each commission
      for (const commission of commissions) {
        try {
          // Update commission
          commission.status = 'paid';
          commission.paymentDate = paymentDate || new Date();
          commission.paymentMethod = paymentMethod || 'cash';
          commission.receiptNumber = `COMM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          commission.recordedBy = req.user.id;
          
          if (notes) {
            commission.notes = notes;
          }
  
          await commission.save();
  
          // Create expense record
          const expense = new Expense({
            description: `عمولة الأستاذ ${commission.teacher.name} ${commission.student ? `عن الطالب ${commission.student.name}` : ''} لحصة ${commission.class.name} لشهر ${commission.month}`,
            amount: commission.amount,
            category: 'salary',
            type: 'teacher_payment',
            recipient: {
              type: 'teacher',
              id: commission.teacher._id,
              name: commission.teacher.name
            },
            paymentMethod: commission.paymentMethod,
            receiptNumber: commission.receiptNumber,
            status: 'paid',
            recordedBy: req.user.id,
            notes: commission.notes || ''
          });
  
          await expense.save();
  
          // Create financial transaction
          const transaction = new FinancialTransaction({
            type: 'expense',
            amount: commission.amount,
            description: expense.description,
            category: 'salary',
            recordedBy: req.user.id,
            reference: commission._id,
            date: commission.paymentDate
          });
  
          await transaction.save();
  
          results.paid++;
          results.totalAmount += commission.amount;
          results.commissions.push({
            _id: commission._id,
            teacher: commission.teacher.name,
            amount: commission.amount
          });
          results.expenses.push(expense._id);
  
        } catch (err) {
          console.error('Error processing commission:', err);
          results.failed++;
        }
      }
  
      res.json({
        success: true,
        message: `تم دفع ${results.paid} من ${results.total} عمولة بنجاح`,
        data: results
      });
  
    } catch (err) {
      console.error('Error paying all commissions:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });
  
  // POST /api/accounting/teacher-commissions/generate-for-month - Generate commissions for a month
// POST /api/accounting/teacher-commissions/generate - متوافق مع الواجهة الحالية
app.post('/api/accounting/teacher-commissions/generate', async (req, res) => {
  try {
    const { schoolId, month, teacherId } = req.body;
    
    console.log(`📊 إنشاء عمولات للشهر ${month}`);
    
    if (!schoolId || !month) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId) والشهر (month)'
      });
    }

    // جلب جميع الحصص النشطة
    const classesQuery = { schoolId: schoolId, teacher: { $ne: null } };
    if (teacherId) classesQuery.teacher = teacherId;
    
    const classes = await Class.find(classesQuery)
      .populate('teacher', 'name')
      .populate('students', 'name studentId');

    const results = {
      generated: 0,
      skipped: 0,
      errors: 0,
      details: []
    };

    const teacherSharePercentage = 70;

    // حساب عدد الحصص في الشهر
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);
    endDate.setHours(23, 59, 59, 999);

    for (const classObj of classes) {
      try {
        // جلب الحصص الحية لهذه الحصة في الشهر
        const liveClasses = await LiveClass.find({
          class: classObj._id,
          date: { $gte: startDate, $lte: endDate },
          status: { $in: ['scheduled', 'ongoing', 'completed'] }
        });
        
        const totalSessions = liveClasses.length;

        // التحقق من وجود عمولة سابقة
        const existingCommission = await TeacherCommission.findOne({
          schoolId: schoolId,
          teacher: classObj.teacher._id,
          class: classObj._id,
          month: month
        });

        if (existingCommission) {
          // ✅ تحديث العمولة الموجودة بحساب الحضور
          const studentsWithAttendance = classObj.students.map(student => {
            // حساب عدد الحضور لهذا الطالب
            let presentCount = 0;
            
            liveClasses.forEach(lc => {
              const attendanceRecord = lc.attendance.find(
                att => att.student && att.student.toString() === student._id.toString()
              );
              if (attendanceRecord && (attendanceRecord.status === 'present' || attendanceRecord.status === 'late')) {
                presentCount++;
              }
            });
            
            const teacherShare = (classObj.price || 0) * (teacherSharePercentage / 100);
            
            return {
              student: student._id,
              studentName: student.name,
              attendancesCount: presentCount,
              totalSessions: totalSessions,
              attendanceDisplay: `${presentCount}/${totalSessions}`,
              teacherShare: teacherShare,
              status: 'pending',
              isActive: true
            };
          });
          
          const totalAmount = studentsWithAttendance.reduce((sum, s) => sum + s.teacherShare, 0);
          
          // تحديث العمولة الموجودة
          existingCommission.students = studentsWithAttendance;
          existingCommission.totalAmount = totalAmount;
          existingCommission.remainingAmount = totalAmount - existingCommission.totalPaid;
          existingCommission.updateStatus();
          await existingCommission.save();
          
          results.skipped++;
          results.details.push({
            class: classObj.name,
            teacher: classObj.teacher.name,
            status: 'محدثة',
            commissionId: existingCommission._id
          });
          continue;
        }

        if (!classObj.students || classObj.students.length === 0) {
          results.skipped++;
          results.details.push({
            class: classObj.name,
            teacher: classObj.teacher.name,
            status: 'لا يوجد طلاب'
          });
          continue;
        }

        // حساب العمولة مع عدد الحضور لكل طالب
        const teacherShare = (classObj.price || 0) * (teacherSharePercentage / 100);
        
        const studentsWithAttendance = classObj.students.map(student => {
          let presentCount = 0;
          
          liveClasses.forEach(lc => {
            const attendanceRecord = lc.attendance.find(
              att => att.student && att.student.toString() === student._id.toString()
            );
            if (attendanceRecord && (attendanceRecord.status === 'present' || attendanceRecord.status === 'late')) {
              presentCount++;
            }
          });
          
          return {
            student: student._id,
            studentName: student.name,
            attendancesCount: presentCount,
            totalSessions: totalSessions,
            attendanceDisplay: `${presentCount}/${totalSessions}`,
            teacherShare: teacherShare,
            status: 'pending',
            isActive: true
          };
        });
        
        const totalAmount = studentsWithAttendance.reduce((sum, s) => sum + s.teacherShare, 0);

        // إنشاء سجل العمولة
        const commission = new TeacherCommission({
          schoolId: schoolId,
          teacher: classObj.teacher._id,
          class: classObj._id,
          month: month,
          totalAmount: totalAmount,
          percentage: teacherSharePercentage,
          status: 'pending',
          totalPaid: 0,
          remainingAmount: totalAmount,
          recordedBy: req.user?.id || null,
          students: studentsWithAttendance
        });

        await commission.save();

        // إنشاء دفعات للطلاب
        for (const student of classObj.students) {
          const existingPayment = await Payment.findOne({
            schoolId: schoolId,
            student: student._id,
            class: classObj._id,
            monthCode: month
          });

          if (!existingPayment) {
            const payment = new Payment({
              schoolId: schoolId,
              student: student._id,
              class: classObj._id,
              amount: classObj.price || 0,
              month: new Date(month).toLocaleString('ar-EG', { month: 'long', year: 'numeric' }),
              monthCode: month,
              status: 'pending',
              recordedBy: req.user?.id || null,
              commissionRecorded: true,
              commissionId: commission._id
            });
            await payment.save();
          }
        }

        results.generated++;
        results.details.push({
          class: classObj.name,
          teacher: classObj.teacher.name,
          status: 'تم الإنشاء',
          commissionId: commission._id,
          studentsCount: classObj.students.length,
          totalAmount: totalAmount,
          totalSessions: totalSessions
        });

        console.log(`✅ تم إنشاء عمولة للأستاذ ${classObj.teacher.name}`);

      } catch (err) {
        results.errors++;
        results.details.push({
          class: classObj.name,
          error: err.message
        });
        console.error(`❌ خطأ:`, err.message);
      }
    }

    res.json({
      success: true,
      message: `تم إنشاء ${results.generated} عمولة جديدة، تحديث ${results.skipped}`,
      data: results,
      month: month,
      schoolId: schoolId
    });

  } catch (err) {
    console.error('❌ خطأ في إنشاء العمولات:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
  
  // PUT /api/accounting/teacher-commissions/:id/cancel - متوافق مع الواجهة الحالية
app.put('/api/accounting/teacher-commissions/:id/cancel', async (req, res) => {
  try {
    const commissionId = req.params.id;
    const { studentId, reason } = req.body;
    
    console.log(`🗑️ إلغاء عمولة: ${commissionId}`);

    const commission = await TeacherCommission.findById(commissionId)
      .populate('teacher', 'name')
      .populate('class', 'name');

    if (!commission) {
      return res.status(404).json({
        success: false,
        error: 'العمولة غير موجودة'
      });
    }

    // إذا تم تحديد طالب معين
    if (studentId) {
      const studentIndex = commission.students.findIndex(
        s => s.student.toString() === studentId
      );

      if (studentIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'الطالب غير موجود في هذه العمولة'
        });
      }

      if (commission.students[studentIndex].status === 'paid') {
        return res.status(400).json({
          success: false,
          error: 'لا يمكن إلغاء عمولة طالب مدفوع'
        });
      }

      // إلغاء عمولة الطالب
      commission.students[studentIndex].status = 'cancelled';
      commission.students[studentIndex].isActive = false;
      
      const cancelledAmount = commission.students[studentIndex].teacherShare || 0;
      commission.totalAmount -= cancelledAmount;
      commission.remainingAmount = commission.totalAmount - commission.totalPaid;

      if (commission.remainingAmount <= 0) {
        commission.status = 'paid';
      } else if (commission.totalPaid > 0) {
        commission.status = 'partial';
      } else {
        commission.status = 'pending';
      }

      if (reason) {
        commission.notes = `إلغاء عمولة الطالب: ${reason}`;
      }

      await commission.save();

      // تحديث الدفعة المرتبطة
      await Payment.updateOne(
        {
          student: studentId,
          class: commission.class,
          monthCode: commission.month,
          commissionId: commission._id
        },
        { status: 'cancelled' }
      );

      res.json({
        success: true,
        message: 'تم إلغاء عمولة الطالب بنجاح',
        commission: commission,
        studentId: studentId
      });

    } else {
      // إلغاء العمولة بالكامل
      if (commission.status === 'paid') {
        return res.status(400).json({
          success: false,
          error: 'لا يمكن إلغاء عمولة مدفوعة بالكامل'
        });
      }

      commission.status = 'cancelled';
      commission.remainingAmount = 0;
      if (reason) {
        commission.notes = `إلغاء العمولة: ${reason}`;
      }
      await commission.save();

      // تحديث جميع الدفعات المرتبطة
      await Payment.updateMany(
        {
          class: commission.class,
          monthCode: commission.month,
          commissionId: commission._id
        },
        { status: 'cancelled' }
      );

      res.json({
        success: true,
        message: 'تم إلغاء العمولة بنجاح',
        commission: commission
      });
    }

  } catch (err) {
    console.error('❌ خطأ في إلغاء العمولة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
  
  // PUT /api/accounting/teacher-commissions/:id - Update commission
  app.put('/api/accounting/teacher-commissions/:id',  async (req, res) => {
    try {
      const { amount, percentage, status, notes, studentDetails } = req.body;
  
      const commission = await TeacherCommission.findById(req.params.id);
  
      if (!commission) {
        return res.status(404).json({ 
          success: false,
          error: 'العمولة غير موجودة' 
        });
      }
  
      // Update fields
      if (amount) commission.amount = amount;
      if (percentage) commission.percentage = percentage;
      if (status) commission.status = status;
      if (notes) commission.notes = notes;
      if (studentDetails) commission.studentDetails = studentDetails;
  
      await commission.save();
  
      await commission.populate('teacher', 'name');
      await commission.populate('student', 'name');
      await commission.populate('class', 'name');
  
      res.json({
        success: true,
        message: 'تم تحديث العمولة بنجاح',
        data: commission
      });
  
    } catch (err) {
      console.error('Error updating commission:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });
  
  // DELETE /api/accounting/teacher-commissions/:id - Delete/cancel commission
  app.delete('/api/accounting/teacher-commissions/:id',  async (req, res) => {
    try {
      const commission = await TeacherCommission.findById(req.params.id);
  
      if (!commission) {
        return res.status(404).json({ 
          success: false,
          error: 'العمولة غير موجودة' 
        });
      }
  
      // Soft delete - mark as cancelled instead of actually deleting
      commission.status = 'cancelled';
      await commission.save();
  
      res.json({
        success: true,
        message: 'تم إلغاء العمولة بنجاح'
      });
  
    } catch (err) {
      console.error('Error cancelling commission:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });
  
  // GET /api/accounting/teacher-commissions/summary - Get summary statistics
  app.get('/api/accounting/teacher-commissions/summary',  async (req, res) => {
    try {
      const { month, year } = req.query;
  
      const matchStage = {};
      if (month) matchStage.month = month;
      if (year) matchStage.month = { $regex: `^${year}` };
  
      const summary = await TeacherCommission.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);
  
      const teachersSummary = await TeacherCommission.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$teacher',
            totalAmount: { $sum: '$amount' },
            pendingAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0]
              }
            },
            paidAmount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0]
              }
            },
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'teachers',
            localField: '_id',
            foreignField: '_id',
            as: 'teacher'
          }
        },
        {
          $project: {
            teacher: { $arrayElemAt: ['$teacher', 0] },
            totalAmount: 1,
            pendingAmount: 1,
            paidAmount: 1,
            count: 1
          }
        }
      ]);
  
      const result = {
        byStatus: summary.reduce((acc, item) => {
          acc[item._id] = {
            amount: item.totalAmount,
            count: item.count
          };
          return acc;
        }, {}),
        byTeacher: teachersSummary,
        total: {
          amount: summary.reduce((sum, item) => sum + item.totalAmount, 0),
          count: summary.reduce((sum, item) => sum + item.count, 0)
        }
      };
  
      res.json({
        success: true,
        data: result
      });
  
    } catch (err) {
      console.error('Error getting commissions summary:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });
  // الحصول على جدول دراسة القاعة
  app.get('/api/classrooms/:id/schedule',  async (req, res) => {
    try {
      const classroomId = req.params.id;
      
      // الحصول على جميع الحصص التي تستخدم هذه القاعة
      const classesWithThisClassroom = await Class.find({
        'schedule.classroom': classroomId
      })
        .populate('teacher')
        .populate('schedule.classroom')
        .populate('students');
      
      // تحويل البيانات إلى جدول
      const schedule = [];
      classesWithThisClassroom.forEach(cls => {
        cls.schedule.forEach(session => {
          if (session.classroom._id.toString() === classroomId) {
            schedule.push({
              classId: cls._id,
              className: cls.name,
              subject: cls.subject,
              teacher: cls.teacher?.name || 'غير معروف',
              day: session.day,
              time: session.time,
              duration: 120 // يمكن حسابها من وقت البداية والنهاية
            });
          }
        });
      });
      
      // ترتيب الجدول حسب اليوم والوقت
      const dayOrder = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
      schedule.sort((a, b) => {
        const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
        if (dayDiff !== 0) return dayDiff;
        return a.time.localeCompare(b.time);
      });
      
      res.json(schedule);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // الحصول على الحصص الحالية في القاعة
  app.get('/api/classrooms/:id/current-classes',  async (req, res) => {
    try {
      const classroomId = req.params.id;
      const now = new Date();
      const day = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][now.getDay()];
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // الحصول على جميع الحصص المجدولة اليوم
      const classesToday = await Class.find({
        'schedule.classroom': classroomId,
        'schedule.day': day
      })
        .populate('teacher')
        .populate('students');
      
      const currentClasses = [];
      
      classesToday.forEach(cls => {
        cls.schedule.forEach(session => {
          if (session.classroom.toString() === classroomId) {
            const [hour, minute] = session.time.split(':').map(Number);
            // افتراض أن الحصة مدتها ساعتين
            const startMinutes = hour * 60 + minute;
            const endMinutes = startMinutes + 120;
            const currentMinutes = currentHour * 60 + currentMinute;
            
            if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
              currentClasses.push({
                class: cls.name,
                subject: cls.subject,
                teacher: cls.teacher?.name,
                startTime: session.time,
                endTime: `${Math.floor(endMinutes / 60)}:${(endMinutes % 60).toString().padStart(2, '0')}`,
                studentsCount: cls.students.length
              });
            }
          }
        });
      });
      
      res.json(currentClasses);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


    // activate student
    app.put('/api/students/:id/activate',  async (req, res) => {
      try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ error: 'الطالب غير موجود' });
        student.active = true;
        await student.save();
        res.json(student);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

// ==============================================
// 📚 CREATE STUDENT - With School ID
// ==============================================

// ==============================================
// 📚 CREATE STUDENT - With School ID and Registration Fee
// ==============================================

// تعديل دالة إنشاء الطالب
// ==============================================
// 📚 CREATE STUDENT - بدون أي تحقق مسبق
// ==============================================
app.post('/api/students', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    
    console.log('📝 إنشاء طالب جديد:', req.body);
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    // ✅ التحقق من وجود المدرسة
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'المدرسة غير موجودة'
      });
    }

    const { name, parentPhone, academicYear } = req.body;

    // ✅ التحقق من البيانات الأساسية فقط
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'اسم الطالب مطلوب'
      });
    }

    if (!parentPhone || !parentPhone.trim()) {
      return res.status(400).json({
        success: false,
        error: 'رقم هاتف ولي الأمر مطلوب'
      });
    }

    if (!academicYear) {
      return res.status(400).json({
        success: false,
        error: 'السنة الدراسية مطلوبة'
      });
    }

    // ✅ إنشاء معرف طالب فريد
    const studentId = `STU-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // ✅ إنشاء اسم مستخدم وكلمة مرور للطالب
    const username = generateStudentUsername(name, academicYear);
    const password = generateStudentPassword(name, academicYear);
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ إنشاء الطالب الجديد (بدون أي تحقق مسبق)
    const studentData = {
      schoolId: schoolId,
      name: name.trim(),
      studentId: studentId,
      parentPhone: parentPhone.trim(),
      parentName: req.body.parentName || '',
      parentEmail: req.body.parentEmail || '',
      birthDate: req.body.birthDate ? new Date(req.body.birthDate) : null,
      academicYear: academicYear,
      registrationDate: new Date(),
      status: req.body.status || 'pending',
      active: true,
      new: true,
      username: username,
      password: hashedPassword,
      studentAccountCreated: false,
      classes: req.body.classes || [],
      registrationData: {
        address: req.body.address || '',
        previousSchool: req.body.previousSchool || '',
        healthInfo: req.body.healthInfo || '',
        documents: req.body.documents || []
      }
    };

    const student = new Student(studentData);
    await student.save();
    
    console.log(`✅ تم إنشاء الطالب: ${student.name} (${student.studentId})`);
    console.log(`👤 اسم المستخدم: ${username}`);
    console.log(`🔑 كلمة المرور: ${password}`);

    // ✅ إنشاء سجل رسوم التسجيل (اختياري)
    const registrationAmount = 600;
    const schoolFee = new SchoolFee({
      student: student._id,
      amount: registrationAmount,
      status: 'pending',
      schoolId: schoolId,
      recordedBy: req.user?.id || null
    });
    await schoolFee.save();

    // ✅ إرجاع الاستجابة مع بيانات الطالب
    res.status(201).json({
      success: true,
      message: "✅ تم إنشاء الطالب بنجاح",
      student: {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
        academicYear: student.academicYear,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        parentEmail: student.parentEmail,
        birthDate: student.birthDate,
        registrationDate: student.registrationDate,
        status: student.status,
        active: student.active,
        username: student.username,
        password: password, // كلمة المرور غير المشفرة للطباعة
        plainPassword: password,
        hasPaidRegistration: student.hasPaidRegistration || false
      },
      credentials: {
        username: username,
        password: password
      },
      registrationFee: {
        amount: registrationAmount,
        status: 'pending',
        _id: schoolFee._id
      },
      school: {
        _id: school._id,
        name: school.name,
        schoolKey: school.schoolKey
      }
    });

  } catch (err) {
    console.error('❌ خطأ في إنشاء الطالب:', err);
    
    // معالجة أخطاء التحقق من صحة البيانات
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'خطأ في صحة البيانات',
        details: errors
      });
    }
    
    // معالجة أخطاء التكرار (إذا كان هناك فهرس فريد)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        error: `القيمة المكررة في حقل ${field}`,
        field: field,
        value: err.keyValue[field]
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'فشل في إنشاء الطالب: ' + err.message
    });
  }
});

// ==============================================
// دوال مساعدة لإنشاء اسم المستخدم وكلمة المرور
// ==============================================
function generateStudentUsername(name, academicYear) {
  // إزالة المسافات والأحرف الخاصة
  const cleanName = name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '').toLowerCase();
  const yearCode = academicYear || 'STU';
  const timestamp = Date.now().toString().slice(-4);
  const randomNum = Math.floor(100 + Math.random() * 900);
  
  // تنسيق: اسم_الطالب + سنة_دراسية + رقم_عشوائي
  return `${cleanName}_${yearCode}_${timestamp}${randomNum}`.substring(0, 30);
}

function generateStudentPassword(name, academicYear) {
  // إنشاء كلمة مرور: أول 4 أحرف من الاسم + السنة الدراسية + أرقام عشوائية
  const namePart = name.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '').substring(0, 4);
  const yearPart = academicYear || 'STU';
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  
  // كلمة مرور قوية: جزء من الاسم + سنة + أرقام عشوائية
  return `${namePart}${yearPart}${randomPart}`;
}
    
    app.get('/api/accounting/budgets',  async (req, res) => {
      try {
        const { status, category } = req.query;
        const query = {};
        
        if (status) query.status = status;
        if (category) query.category = category;
        
        const budgets = await Budget.find(query)
          .populate('createdBy')
          .sort({ createdAt: -1 });
        
        res.json(budgets);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    
    app.post('/api/accounting/budgets',  async (req, res) => {
      try {
        const { title, amount, category, description, startDate, endDate } = req.body;
        
        const budget = new Budget({
          title,
          amount,
          category,
          description,
          startDate,
          endDate,
          createdBy: req.user.id,
          remainingBudget: amount
        });
        
        await budget.save();
        await budget.populate('createdBy');
        
        res.status(201).json(budget);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });
    
    app.put('/api/accounting/budgets/:id',  async (req, res) => {
      try {
        const budget = await Budget.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
        ).populate('createdBy');
        
        if (!budget) {
          return res.status(404).json({ error: 'الميزانية غير موجودة' });
        }
        
        res.json(budget);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });
    
    // تقرير المصروفات مقابل الميزانية
    app.get('/api/accounting/budget-report',  async (req, res) => {
      try {
        const { startDate, endDate } = req.query;
        
        // الحصول على جميع الميزانيات النشطة
        const budgets = await Budget.find({ 
          status: 'active',
          startDate: { $lte: endDate ? new Date(endDate) : new Date() },
          endDate: { $gte: startDate ? new Date(startDate) : new Date() }
        });
        
        // الحصول على المصروفات في نفس الفترة
        const expenseQuery = { 
          status: 'paid',
          date: {}
        };
        
        if (startDate) expenseQuery.date.$gte = new Date(startDate);
        if (endDate) expenseQuery.date.$lte = new Date(endDate);
        
        const expenses = await Expense.find(expenseQuery);
        
        // تجميع المصروفات حسب الفئة
        const expensesByCategory = {};
        expenses.forEach(expense => {
          if (!expensesByCategory[expense.category]) {
            expensesByCategory[expense.category] = 0;
          }
          expensesByCategory[expense.category] += expense.amount;
        });
        
        // مقارنة مع الميزانية
        const report = budgets.map(budget => {
          const actualSpending = expensesByCategory[budget.category] || 0;
          const remaining = budget.amount - actualSpending;
          const utilizationRate = (actualSpending / budget.amount) * 100;
          
          return {
            budget: budget.toObject(),
            actualSpending,
            remaining,
            utilizationRate,
            status: utilizationRate > 90 ? 'over' : utilizationRate > 75 ? 'warning' : 'good'
          };
        });
        
        res.json(report);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    app.get('/api/accounting/all-transactions',  async (req, res) => {
      try {
        const { type, category, startDate, endDate, status } = req.query;
        const query = {};
    
        if (type) query.type = type;
        if (category) query.category = category;
        if (status) query.status = status;
        if (startDate || endDate) {
          query.date = {};
          if (startDate) query.date.$gte = new Date(startDate);
          if (endDate) query.date.$lte = new Date(endDate);
        }
    
        // الحصول على جميع المعاملات المالية
        const transactions = await FinancialTransaction.find(query)
          .populate('recordedBy')
          .sort({ date: -1 });
        
        // الحصول على رسوم التسجيل
        const schoolFeeQuery = {};
        if (status) schoolFeeQuery.status = status;
        if (startDate || endDate) {
          schoolFeeQuery.paymentDate = {};
          if (startDate) schoolFeeQuery.paymentDate.$gte = new Date(startDate);
          if (endDate) schoolFeeQuery.paymentDate.$lte = new Date(endDate);
        }
        
        const schoolFees = await SchoolFee.find(schoolFeeQuery)
          .populate('student')
          .populate('recordedBy')
          .sort({ paymentDate: -1 });
        
        // دمج النتائج مع إضافة حقل للنوع
        const allTransactions = [
          ...transactions.map(t => ({
            _id: t._id,
            type: t.type,
            amount: t.amount,
            description: t.description,
            category: t.category,
            date: t.date,
            recordedBy: t.recordedBy,
            transactionType: 'financial'
          })),
          ...schoolFees.map(f => ({
            _id: f._id,
            type: 'income', // تأكد من أن النوع income
            amount: f.amount,
            description: `رسوم تسجيل الطالب ${f.student?.name || 'غير معروف'}`,
            category: 'registration', // نفس التصنيف المستخدم في المعاملات المالية
            date: f.paymentDate || f.createdAt,
            recordedBy: f.recordedBy,
            status: f.status,
            transactionType: 'schoolFee'
          }))
        ].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.json(allTransactions);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    // get monthly atandance for class  using live classes shema

    // Get available classes for student enrollment
  // Get available classes (classes that are not full and match certain criteria)
  // app.get('/api/classes/available',  async (req, res) => {
  //   try {
  //     const { 
  //       studentId, 
  //       academicYear, 
  //       subject, 
  //       excludeEnrolled = 'true',
  //       limit = 50 
  //     } = req.query;
      
  //     // Build query
  //     const query = {};
      
  //     if (academicYear) {
  //       query.academicYear = academicYear;
  //     }
      
  //     if (subject) {
  //       query.subject = subject;
  //     }
      
  //     // Get classes
  //     const classes = await Class.find(query)
  //       .populate('teacher', 'name subjects phone email')
  //       .populate('students', 'name studentId academicYear')
  //       .populate('schedule.classroom', 'name capacity location')
  //       .limit(parseInt(limit))
  //       .sort({ name: 1 });
      
  //     let availableClasses = classes;
      
  //     // Filter out classes the student is already enrolled in
  //     if (studentId && excludeEnrolled === 'true') {
  //       const student = await Student.findById(studentId);
  //       if (student && student.classes) {
  //         const enrolledClassIds = student.classes.map(c => c.toString());
  //         availableClasses = classes.filter(c => !enrolledClassIds.includes(c._id.toString()));
  //       }
  //     }
      
  //     // You might also want to filter by capacity
  //     // availableClasses = availableClasses.filter(c => c.students.length < (c.capacity || 50));
      
  //     res.json({
  //       success: true,
  //       count: availableClasses.length,
  //       classes: availableClasses
  //     });
  //   } catch (err) {
  //     console.error('Error in /api/classes/available:', err);
  //     res.status(500).json({ 
  //       success: false,
  //       error: 'Failed to fetch available classes',
  //       message: err.message 
  //     });
  //   }
  // });

  // Add this endpoint with the other class endpoints
// ==============================================
// ✅ نقطة نهاية الحصص المتاحة - مع تصفية حسب المدرسة
// ==============================================
// ==============================================
// ✅ نقطة نهاية الحصص المتاحة - مع تصفية حسب المدرسة
// ==============================================
// ==============================================
// ✅ نقطة نهاية الحصص المتاحة - مع تصفية حسب المدرسة
// ==============================================
// ==============================================
// ✅ نقطة نهاية الحصص المتاحة - نسخة مبسطة ومصححة
// ==============================================
app.get('/api/classes/available', async (req, res) => {
  try {
    // 1. جلب schoolId من الـ query
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    console.log('📚 جلب الحصص المتاحة - schoolId:', schoolId);
    
    // 2. التحقق من وجود schoolId
    if (!schoolId) {
      console.warn('⚠️ لا يوجد schoolId');
      return res.json({
        success: true,
        count: 0,
        classes: [],
        message: 'لم يتم تحديد المدرسة'
      });
    }

    // 3. التحقق من صحة schoolId
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      console.error('❌ schoolId غير صالح:', schoolId);
      return res.status(400).json({
        success: false,
        error: 'معرف المدرسة غير صالح'
      });
    }

    // 4. بناء الاستعلام - نفس استعلام /api/classes الذي يعمل
    const query = { schoolId: schoolId };
    
    // 5. إضافة معايير تصفية إضافية (اختيارية)
    const { academicYear, subject, excludeEnrolled, studentId, limit = 100 } = req.query;
    
    if (academicYear) query.academicYear = academicYear;
    if (subject) query.subject = subject;
    
    console.log('🔍 Query:', JSON.stringify(query, null, 2));

    // 6. جلب الحصص - نفس طريقة /api/classes
    let classes = await Class.find(query)
      .populate('teacher', 'name subjects phone email')
      .populate('students', 'name studentId academicYear')
      .populate('schedule.classroom', 'name capacity location')
      .limit(parseInt(limit))
      .sort({ name: 1 });

    console.log(`✅ تم جلب ${classes.length} حصة للمدرسة ${schoolId}`);

    // 7. تصفية الحصص التي الطالب مسجل فيها (إذا تم تمرير studentId)
    if (studentId && excludeEnrolled === 'true') {
      const student = await Student.findOne({ 
        _id: studentId,
        schoolId: schoolId
      });
      
      if (student && student.classes && student.classes.length > 0) {
        const enrolledClassIds = student.classes.map(c => c.toString());
        const originalCount = classes.length;
        classes = classes.filter(c => !enrolledClassIds.includes(c._id.toString()));
        console.log(`🔍 تم استبعاد ${originalCount - classes.length} حصة مسجل فيها الطالب`);
      }
    }

    // 8. إرجاع النتائج بنفس تنسيق /api/classes
    res.json(classes); // ✅ نفس التنسيق الذي يعمل

  } catch (err) {
    console.error('❌ خطأ في جلب الحصص المتاحة:', err);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الحصص المتاحة',
      message: err.message
    });
  }
});
// ==============================================
// ✅ FIX - إصلاح الحصص التي تفتقر إلى schoolId
// ==============================================
app.post('/api/debug/fix-classes-schoolid', async (req, res) => {
  try {
    const { schoolId, dryRun = false } = req.body;
    
    console.log(`🔧 إصلاح schoolId للحصص: ${schoolId}`);
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد schoolId'
      });
    }

    // جلب جميع الحصص التي ليس لديها schoolId أو لها schoolId مختلف
    const classesToFix = await Class.find({
      $or: [
        { schoolId: { $exists: false } },
        { schoolId: null },
        { schoolId: '' }
      ]
    });

    console.log(`📚 عدد الحصص التي تحتاج إصلاح: ${classesToFix.length}`);

    if (dryRun) {
      return res.json({
        success: true,
        dryRun: true,
        message: `سيتم إصلاح ${classesToFix.length} حصة`,
        classes: classesToFix.map(c => ({
          _id: c._id,
          name: c.name,
          currentSchoolId: c.schoolId || 'غير موجود'
        }))
      });
    }

    // تحديث الحصص
    let updatedCount = 0;
    const updatedClasses = [];

    for (const classObj of classesToFix) {
      classObj.schoolId = schoolId;
      await classObj.save();
      updatedCount++;
      updatedClasses.push({
        _id: classObj._id,
        name: classObj.name,
        newSchoolId: classObj.schoolId
      });
      console.log(`✅ تم إصلاح الحصة: ${classObj.name}`);
    }

    // أيضاً تحديث الحصص التي لها schoolId مختلف (إذا كان المطلوب توحيدها)
    const classesWithDifferentSchoolId = await Class.find({
      schoolId: { $ne: schoolId, $exists: true }
    });

    console.log(`📚 حصص ذات schoolId مختلف: ${classesWithDifferentSchoolId.length}`);

    let updatedDifferentCount = 0;
    const updatedDifferentClasses = [];

    for (const classObj of classesWithDifferentSchoolId) {
      const oldSchoolId = classObj.schoolId;
      classObj.schoolId = schoolId;
      await classObj.save();
      updatedDifferentCount++;
      updatedDifferentClasses.push({
        _id: classObj._id,
        name: classObj.name,
        oldSchoolId: oldSchoolId,
        newSchoolId: classObj.schoolId
      });
      console.log(`✅ تم توحيد schoolId للحصة: ${classObj.name} (${oldSchoolId} -> ${schoolId})`);
    }

    res.json({
      success: true,
      message: `تم إصلاح ${updatedCount + updatedDifferentCount} حصة`,
      details: {
        missingSchoolId: {
          count: updatedCount,
          classes: updatedClasses
        },
        differentSchoolId: {
          count: updatedDifferentCount,
          classes: updatedDifferentClasses
        },
        totalFixed: updatedCount + updatedDifferentCount
      }
    });

  } catch (err) {
    console.error('❌ خطأ في إصلاح الحصص:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
  // الحصول على الغيابات الشهرية لحصة معينة
  app.get('/api/classes/:classId/monthly-attendance', async (req, res) => {
    try {
        const { classId } = req.params;
        const { month, year } = req.query; // الصيغة: YYYY-MM

        // بناء تاريخ البداية والنهاية للشهر المطلوب
        const targetDate = month && year ? new Date(`${year}-${month}-01`) : new Date();
        const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
        const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

        // البحث عن الحصص الحية للحصة المطلوبة خلال الشهر
        const liveClasses = await LiveClass.find({
            class: classId,
            date: {
                $gte: startOfMonth,
                $lte: endOfMonth
            },
            status: { $in: ['completed', 'ongoing'] }
        })
        .populate('class', 'name subject')
        .populate('teacher', 'name')
        .populate('classroom', 'name')
        .populate({
            path: 'attendance.student',
            select: 'name studentId parentName academicYear'
        });

        if (!liveClasses || liveClasses.length === 0) {
            return res.status(404).json({
                message: 'لا توجد حصص مسجلة لهذه الفترة'
            });
        }

        // تجميع بيانات الطلاب والغيابات
        const studentsMap = new Map();
        const classDetails = {
            name: liveClasses[0].class.name,
            subject: liveClasses[0].class.subject,
            month: targetDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })
        };

        // معالجة كل حصة وجمع بيانات الحضور
        liveClasses.forEach(liveClass => {
            liveClass.attendance.forEach(att => {
                const studentId = att.student._id.toString();
                
                if (!studentsMap.has(studentId)) {
                    studentsMap.set(studentId, {
                        student: {
                            _id: att.student._id,
                            name: att.student.name,
                            studentId: att.student.studentId,
                            parentName: att.student.parentName,
                            academicYear: att.student.academicYear
                        },
                        attendanceRecords: []
                    });
                }

                const studentData = studentsMap.get(studentId);
                studentData.attendanceRecords.push({
                    date: liveClass.date,
                    status: att.status,
                    classTime: liveClass.startTime,
                    teacher: liveClass.teacher.name,
                    classroom: liveClass.classroom.name,
                    notes: liveClass.notes
                });
            });
        });

        // حساب الإحصائيات
        const totalClasses = liveClasses.length;
        const studentsAttendance = Array.from(studentsMap.values()).map(studentData => {
            const presentCount = studentData.attendanceRecords.filter(record => 
                record.status === 'present').length;
            const absentCount = studentData.attendanceRecords.filter(record => 
                record.status === 'absent').length;
            const lateCount = studentData.attendanceRecords.filter(record => 
                record.status === 'late').length;

            const attendanceRate = totalClasses > 0 ? 
                Math.round((presentCount / totalClasses) * 100) : 0;

            return {
                ...studentData,
                statistics: {
                    totalClasses,
                    present: presentCount,
                    absent: absentCount,
                    late: lateCount,
                    attendanceRate
                }
            };
        });

        res.json({
            class: classDetails,
            period: {
                start: startOfMonth,
                end: endOfMonth,
                totalClasses: totalClasses
            },
            students: studentsAttendance,
            summary: {
                totalStudents: studentsAttendance.length,
                averageAttendance: studentsAttendance.length > 0 ?
                    Math.round(studentsAttendance.reduce((sum, student) => 
                        sum + student.statistics.attendanceRate, 0) / studentsAttendance.length) : 0
            }
        });

    } catch (error) {
        console.error('Error fetching monthly attendance:', error);
        res.status(500).json({
            message: 'حدث خطأ أثناء جلب بيانات الغيابات',
            error: error.message
        });
    }
  });  // نقطة نهاية جديدة للحصول على تفاصيل الأستاذ مع حصصه ومدفوعاته
app.get('/api/classes/:classId/students', async (req, res) => {
  try {
    const classId = req.params.classId;
    const schoolId = req.user?.schoolId || req.query.schoolId;
    
    console.log(`📚 جلب طلاب الحصة ${classId} للمدرسة ${schoolId}`);
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'School ID is required'
      });
    }

    const classObj = await Class.findOne({
      _id: classId,
      schoolId: schoolId
    }).populate({
      path: 'students',
      match: { schoolId: schoolId },
      select: 'name studentId parentPhone parentEmail academicYear'
    });

    if (!classObj) {
      return res.status(404).json({
        success: false,
        error: 'الحصة غير موجودة أو لا تنتمي للمدرسة'
      });
    }

    res.json({
      success: true,
      data: classObj.students || []
    });

  } catch (err) {
    console.error('❌ خطأ في جلب طلاب الحصة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});




  // تصدير الغيابات الشهرية إلى Excel
  app.get('/api/classes/:classId/monthly-attendance/export', async (req, res) => {
    try {
        const { classId } = req.params;
        const { month } = req.query;

        // جلب البيانات (نفس كود endpoint السابق)
        const attendanceData = await getMonthlyAttendanceData(classId, month);

        // إنشاء workbook جديد
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('الغيابات الشهرية');

        // إضافة headers
        worksheet.columns = [
            { header: 'اسم الطالب', key: 'studentName', width: 25 },
            { header: 'رقم الطالب', key: 'studentId', width: 15 },
            { header: 'الصف', key: 'academicYear', width: 15 },
            { header: 'الحضور', key: 'present', width: 10 },
            { header: 'الغياب', key: 'absent', width: 10 },
            { header: 'التأخير', key: 'late', width: 10 },
            { header: 'نسبة الحضور%', key: 'attendanceRate', width: 15 }
        ];

        // إضافة البيانات
        attendanceData.students.forEach(student => {
            worksheet.addRow({
                studentName: student.student.name,
                studentId: student.student.studentId,
                academicYear: getAcademicYearName(student.student.academicYear),
                present: student.statistics.present,
                absent: student.statistics.absent,
                late: student.statistics.late,
                attendanceRate: student.statistics.attendanceRate
            });
        });

        // إعداد response للتحميل
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_${classId}_${month}.xlsx`);

        // كتابة workbook إلى response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error exporting attendance:', error);
        res.status(500).json({ message: 'حدث خطأ أثناء التصدير' });
    }
  });

  // نقطة نهاية جديدة للحصول على غيابات حصة معينة من الحصص الحية
  app.get('/api/live-classes/class/:classId/attendance',  async (req, res) => {
    try {
      const { classId } = req.params;
      const { startDate, endDate } = req.query;

      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ error: 'معرف الحصة غير صالح' });
      }

      // الحصول على بيانات الحصة
      const classObj = await Class.findById(classId)
        .populate('teacher')
        .populate('students');
      
      if (!classObj) {
        return res.status(404).json({ error: 'الحصة غير موجودة' });
      }

      // بناء استعلام للحصص الحية
      const query = { 
        class: classId,
        status: { $in: ['completed', 'ongoing'] }
      };

      // إضافة فلترة التاريخ إذا وجدت
      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      } else {
        // افتراضي: آخر 30 يوم
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query.date = { $gte: thirtyDaysAgo };
      }

      // الحصول على الحصص الحية
      const liveClasses = await LiveClass.find(query)
        .populate('attendance.student')
        .populate('classroom')
        .sort({ date: 1, startTime: 1 });

      // ✅ تحقق إذا لم توجد حصص
      if (!liveClasses.length) {
        return res.status(200).json({
          message: 'لا توجد حصص حية لهذه الحصة في الفترة المحددة',
          class: {
            _id: classObj._id,
            name: classObj.name,
            subject: classObj.subject,
            teacher: classObj.teacher?.name
          },
          students: classObj.students.map(student => ({
            _id: student._id,
            name: student.name,
            studentId: student.studentId,
            statistics: { present: 0, absent: 0, late: 0 }
          })),
          summary: {
            totalClasses: 0,
            totalStudents: classObj.students.length,
            totalPresent: 0,
            totalAbsent: 0,
            totalLate: 0
          }
        });
      }

      // تجميع بيانات الطلاب
      const studentsData = classObj.students.map(student => {
        const studentStats = {
          present: 0,
          absent: 0,
          late: 0
        };

        // حساب الإحصائيات لكل طالب
        liveClasses.forEach(lc => {
          const attendanceRecord = lc.attendance.find(
            att => att.student._id.toString() === student._id.toString()
          );
          
          if (attendanceRecord) {
            studentStats[attendanceRecord.status]++;
          } else {
            studentStats.absent++; // إذا لم يوجد سجل، يعتبر غائب
          }
        });

        return {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          statistics: studentStats
        };
      });

      // إعداد البيانات للاستجابة
      const responseData = {
        class: {
          _id: classObj._id,
          name: classObj.name,
          subject: classObj.subject,
          teacher: classObj.teacher?.name
        },
        period: startDate && endDate 
          ? `من ${new Date(startDate).toLocaleDateString('ar-EG')} إلى ${new Date(endDate).toLocaleDateString('ar-EG')}`
          : 'آخر 30 يوم',
        liveClasses: liveClasses.map(lc => ({
          _id: lc._id,
          date: lc.date,
          startTime: lc.startTime,
          endTime: lc.endTime,
          classroom: lc.classroom?.name,
          attendance: lc.attendance
        })),
        students: studentsData,
        summary: {
          totalClasses: liveClasses.length,
          totalStudents: classObj.students.length,
          totalPresent: studentsData.reduce((sum, student) => sum + student.statistics.present, 0),
          totalAbsent: studentsData.reduce((sum, student) => sum + student.statistics.absent, 0),
          totalLate: studentsData.reduce((sum, student) => sum + student.statistics.late, 0)
        }
      };

      res.json(responseData);

    } catch (error) {
      console.error('Error fetching class attendance:', error);
      res.status(500).json({ 
        error: 'حدث خطأ أثناء جلب بيانات الحضور',
        message: error.message 
      });
    }
  });
// ==============================================
// نقطة نهاية لجلب غيابات طلاب حصة معينة
// ==============================================
app.get('/api/classes/:classId/attendance', async (req, res) => {
  try {
    const { classId } = req.params;
    const { month, year, startDate, endDate } = req.query;
    
    console.log(`📊 جلب غيابات الحصة: ${classId}`);
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الحصة غير صالح'
      });
    }

    // بناء نطاق التاريخ
    let dateRange = {};
    
    if (startDate && endDate) {
      dateRange = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      dateRange = {
        $gte: start,
        $lte: end
      };
    } else {
      // افتراضي: آخر 30 يوم
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      dateRange = {
        $gte: start,
        $lte: end
      };
    }

    // الحصول على جميع الحصص الحية لهذه الحصة في الفترة المحددة
    const liveClasses = await LiveClass.find({
      class: classId,
      date: dateRange,
      status: { $in: ['completed', 'ongoing'] }
    })
    .populate({
      path: 'attendance.student',
      select: 'name studentId parentPhone parentEmail academicYear'
    })
    .populate('class', 'name subject')
    .populate('teacher', 'name')
    .sort({ date: 1, startTime: 1 });

    // الحصول على معلومات الحصة الأساسية
    const classInfo = await Class.findById(classId)
      .populate('students', 'name studentId academicYear')
      .populate('teacher', 'name');

    if (!classInfo) {
      return res.status(404).json({
        success: false,
        error: 'الحصة غير موجودة'
      });
    }

    // تجميع بيانات الغيابات لكل طالب
    const attendanceMap = new Map();

    // تهيئة جميع الطلاب
    classInfo.students.forEach(student => {
      attendanceMap.set(student._id.toString(), {
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          academicYear: student.academicYear
        },
        totalClasses: liveClasses.length,
        present: 0,
        absent: 0,
        late: 0,
        attendanceRate: 0,
        records: []
      });
    });

    // تجميع سجلات الحضور
    liveClasses.forEach(liveClass => {
      liveClass.attendance.forEach(record => {
        const studentId = record.student._id.toString();
        if (attendanceMap.has(studentId)) {
          const studentData = attendanceMap.get(studentId);
          
          // تحديث الإحصائيات
          studentData[record.status]++;
          
          // إضافة السجل
          studentData.records.push({
            liveClassId: liveClass._id,
            date: liveClass.date,
            startTime: liveClass.startTime,
            endTime: liveClass.endTime,
            status: record.status,
            teacher: liveClass.teacher?.name,
            joinedAt: record.joinedAt,
            leftAt: record.leftAt
          });
        }
      });
    });

    // حساب نسب الحضور
    attendanceMap.forEach((data, studentId) => {
      data.attendanceRate = liveClasses.length > 0 
        ? Math.round((data.present / liveClasses.length) * 100) 
        : 0;
    });

    // تحويل الخريطة إلى مصفوفة
    const studentsAttendance = Array.from(attendanceMap.values());

    // ترتيب الطلاب حسب نسبة الغياب (الأكثر غياباً أولاً)
    studentsAttendance.sort((a, b) => {
      const aAbsentRate = a.absent / (a.totalClasses || 1);
      const bAbsentRate = b.absent / (b.totalClasses || 1);
      return bAbsentRate - aAbsentRate;
    });

    // إحصائيات عامة
    const statistics = {
      totalClasses: liveClasses.length,
      totalStudents: classInfo.students.length,
      totalPresent: studentsAttendance.reduce((sum, s) => sum + s.present, 0),
      totalAbsent: studentsAttendance.reduce((sum, s) => sum + s.absent, 0),
      totalLate: studentsAttendance.reduce((sum, s) => sum + s.late, 0),
      averageAttendance: studentsAttendance.length > 0
        ? Math.round(studentsAttendance.reduce((sum, s) => sum + s.attendanceRate, 0) / studentsAttendance.length)
        : 0,
      mostAbsentStudent: studentsAttendance[0]?.student || null,
      leastAbsentStudent: studentsAttendance[studentsAttendance.length - 1]?.student || null
    };

    // تفاصيل الحصص
    const classesDetails = liveClasses.map(lc => ({
      _id: lc._id,
      date: lc.date,
      startTime: lc.startTime,
      endTime: lc.endTime,
      teacher: lc.teacher?.name,
      status: lc.status,
      attendanceCount: lc.attendance.length,
      presentCount: lc.attendance.filter(a => a.status === 'present').length,
      absentCount: lc.attendance.filter(a => a.status === 'absent').length,
      lateCount: lc.attendance.filter(a => a.status === 'late').length
    }));

    res.json({
      success: true,
      data: {
        class: {
          _id: classInfo._id,
          name: classInfo.name,
          subject: classInfo.subject,
          teacher: classInfo.teacher?.name,
          academicYear: classInfo.academicYear
        },
        period: {
          start: dateRange.$gte,
          end: dateRange.$lte,
          totalDays: liveClasses.length
        },
        statistics,
        studentsAttendance,
        classesDetails
      }
    });

  } catch (err) {
    console.error('❌ خطأ في جلب بيانات الغيابات:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// نقطة نهاية لتسجيل غياب طالب في حصة محددة
// ==============================================

// ENROLL STUDENT - WITHOUT AUTHENTICATION (for testing)

app.post('/api/classes/:classId/attendance/student/:studentId', async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const { status, date, notes } = req.body;

    console.log(`📝 تسجيل غياب للطالب ${studentId} في الحصة ${classId}`);

    // التحقق من صحة المعرفات
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف غير صالح'
      });
    }

    // تحديد تاريخ الحصة (اليوم أو التاريخ المحدد)
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // البحث عن حصة حية في هذا التاريخ
    let liveClass = await LiveClass.findOne({
      class: classId,
      date: {
        $gte: targetDate,
        $lt: nextDay
      }
    });

    // إذا لم توجد حصة حية، قم بإنشائها
    if (!liveClass) {
      // الحصول على معلومات الحصة لإنشاء حصة حية
      const classInfo = await Class.findById(classId)
        .populate('students')
        .populate('teacher');

      if (!classInfo) {
        return res.status(404).json({
          success: false,
          error: 'الحصة غير موجودة'
        });
      }

      // إنشاء سجلات الحضور لجميع الطلاب (افتراضي: غائب)
      const attendance = classInfo.students.map(student => ({
        student: student._id,
        status: 'absent',
        joinedAt: null,
        leftAt: null
      }));

      liveClass = new LiveClass({
        class: classId,
        date: targetDate,
        startTime: classInfo.schedule?.[0]?.time || '08:00',
        endTime: '10:00',
        teacher: classInfo.teacher?._id,
        attendance: attendance,
        status: 'completed',
        createdBy: req.user?.id || null,
        month: targetDate.toISOString().slice(0, 7)
      });

      await liveClass.save();
      console.log('✅ تم إنشاء حصة حية جديدة');
    }

    // البحث عن سجل الطالب في الحصة
    const attendanceIndex = liveClass.attendance.findIndex(
      a => a.student.toString() === studentId
    );

    if (attendanceIndex >= 0) {
      // تحديث السجل الموجود
      liveClass.attendance[attendanceIndex].status = status || 'absent';
      if (status === 'present' || status === 'late') {
        liveClass.attendance[attendanceIndex].joinedAt = new Date();
      }
    } else {
      // إضافة سجل جديد
      liveClass.attendance.push({
        student: studentId,
        status: status || 'absent',
        joinedAt: (status === 'present' || status === 'late') ? new Date() : null,
        leftAt: null
      });
    }

    await liveClass.save();

    // جلب البيانات المحدثة
    const updatedLiveClass = await LiveClass.findById(liveClass._id)
      .populate('attendance.student', 'name studentId');

    res.json({
      success: true,
      message: `تم تسجيل حالة الطالب بنجاح`,
      data: {
        liveClassId: liveClass._id,
        student: updatedLiveClass.attendance.find(a => a.student._id.toString() === studentId)
      }
    });

  } catch (err) {
    console.error('❌ خطأ في تسجيل الغياب:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// نقطة نهاية لتسجيل غياب جماعي
// ==============================================
app.post('/api/classes/:classId/attendance/bulk', async (req, res) => {
  try {
    const { classId } = req.params;
    const { attendance, date } = req.body;

    console.log(`📝 تسجيل غياب جماعي للحصة ${classId}`);

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // البحث عن حصة حية أو إنشائها
    let liveClass = await LiveClass.findOne({
      class: classId,
      date: {
        $gte: targetDate,
        $lt: nextDay
      }
    });

    if (!liveClass) {
      const classInfo = await Class.findById(classId).populate('teacher');
      liveClass = new LiveClass({
        class: classId,
        date: targetDate,
        startTime: '08:00',
        endTime: '10:00',
        teacher: classInfo?.teacher?._id,
        attendance: [],
        status: 'completed',
        createdBy: req.user?.id || null,
        month: targetDate.toISOString().slice(0, 7)
      });
    }

    // تحديث سجلات الحضور
    attendance.forEach(record => {
      const index = liveClass.attendance.findIndex(
        a => a.student.toString() === record.studentId
      );

      const attendanceRecord = {
        student: record.studentId,
        status: record.status || 'absent',
        joinedAt: record.joinedAt ? new Date(record.joinedAt) : null,
        leftAt: record.leftAt ? new Date(record.leftAt) : null
      };

      if (index >= 0) {
        liveClass.attendance[index] = attendanceRecord;
      } else {
        liveClass.attendance.push(attendanceRecord);
      }
    });

    await liveClass.save();

    res.json({
      success: true,
      message: `تم تسجيل ${attendance.length} طالب بنجاح`,
      data: {
        liveClassId: liveClass._id,
        totalAttendance: liveClass.attendance.length
      }
    });

  } catch (err) {
    console.error('❌ خطأ في التسجيل الجماعي:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
// ==============================================
// نقطة نهاية إلغاء الدفعة (جعلها غير مدفوعة)
// ==============================================
// ==============================================
// نقطة نهاية إلغاء الدفعة (جعلها غير مدفوعة)
// ==============================================
// ==============================================
// نقطة نهاية إلغاء الدفعة (جعلها غير مدفوعة)
// ==============================================

// ==============================================
// نقطة نهاية تسديد دفعة معلقة
// ==============================================


// ==============================================
// نقطة نهاية الغيابات المحسنة
// ==============================================
app.get('/api/classes/:classId/attendance',  async (req, res) => {
  try {
    const { classId } = req.params;
    const { startDate, endDate } = req.query;
    
    console.log(`جلب غيابات الحصة: ${classId}`);
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الحصة غير صالح'
      });
    }

    // بناء نطاق التاريخ
    let dateRange = {};
    
    if (startDate && endDate) {
      dateRange = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // افتراضي: آخر 30 يوم
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      dateRange = {
        $gte: start,
        $lte: end
      };
    }

    // الحصول على جميع الحصص الحية لهذه الحصة في الفترة المحددة
    const liveClasses = await LiveClass.find({
      class: classId,
      date: dateRange,
      status: { $in: ['completed', 'ongoing'] }
    })
    .populate({
      path: 'attendance.student',
      select: 'name studentId parentPhone parentEmail academicYear'
    })
    .populate('class', 'name subject')
    .populate('teacher', 'name')
    .sort({ date: 1, startTime: 1 });

    // الحصول على معلومات الحصة الأساسية
    const classInfo = await Class.findById(classId)
      .populate('students', 'name studentId academicYear')
      .populate('teacher', 'name');

    if (!classInfo) {
      return res.status(404).json({
        success: false,
        error: 'الحصة غير موجودة'
      });
    }

    // تجميع بيانات الغيابات لكل طالب
    const attendanceMap = new Map();

    // تهيئة جميع الطلاب
    classInfo.students.forEach(student => {
      attendanceMap.set(student._id.toString(), {
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          academicYear: student.academicYear
        },
        totalClasses: liveClasses.length,
        present: 0,
        absent: 0,
        late: 0,
        attendanceRate: 0,
        records: []
      });
    });

    // تجميع سجلات الحضور
    liveClasses.forEach(liveClass => {
      liveClass.attendance.forEach(record => {
        const studentId = record.student._id.toString();
        if (attendanceMap.has(studentId)) {
          const studentData = attendanceMap.get(studentId);
          
          // تحديث الإحصائيات
          studentData[record.status]++;
          
          // إضافة السجل
          studentData.records.push({
            liveClassId: liveClass._id,
            date: liveClass.date,
            startTime: liveClass.startTime,
            endTime: liveClass.endTime,
            status: record.status,
            teacher: liveClass.teacher?.name,
            joinedAt: record.joinedAt,
            leftAt: record.leftAt
          });
        }
      });
    });

    // حساب نسب الحضور
    attendanceMap.forEach((data, studentId) => {
      data.attendanceRate = liveClasses.length > 0 
        ? Math.round((data.present / liveClasses.length) * 100) 
        : 0;
    });

    // تحويل الخريطة إلى مصفوفة
    const studentsAttendance = Array.from(attendanceMap.values());

    // ترتيب الطلاب حسب نسبة الغياب (الأكثر غياباً أولاً)
    studentsAttendance.sort((a, b) => {
      const aAbsentRate = a.absent / (a.totalClasses || 1);
      const bAbsentRate = b.absent / (b.totalClasses || 1);
      return bAbsentRate - aAbsentRate;
    });

    // إحصائيات عامة
    const statistics = {
      totalClasses: liveClasses.length,
      totalStudents: classInfo.students.length,
      totalPresent: studentsAttendance.reduce((sum, s) => sum + s.present, 0),
      totalAbsent: studentsAttendance.reduce((sum, s) => sum + s.absent, 0),
      totalLate: studentsAttendance.reduce((sum, s) => sum + s.late, 0),
      averageAttendance: studentsAttendance.length > 0
        ? Math.round(studentsAttendance.reduce((sum, s) => sum + s.attendanceRate, 0) / studentsAttendance.length)
        : 0
    };

    // تفاصيل الحصص
    const classesDetails = liveClasses.map(lc => ({
      _id: lc._id,
      date: lc.date,
      startTime: lc.startTime,
      endTime: lc.endTime,
      teacher: lc.teacher?.name,
      status: lc.status,
      attendanceCount: lc.attendance.length,
      presentCount: lc.attendance.filter(a => a.status === 'present').length,
      absentCount: lc.attendance.filter(a => a.status === 'absent').length,
      lateCount: lc.attendance.filter(a => a.status === 'late').length
    }));

    res.json({
      success: true,
      data: {
        class: {
          _id: classInfo._id,
          name: classInfo.name,
          subject: classInfo.subject,
          teacher: classInfo.teacher?.name,
          academicYear: classInfo.academicYear
        },
        period: {
          start: dateRange.$gte,
          end: dateRange.$lte,
          totalDays: liveClasses.length
        },
        statistics,
        studentsAttendance,
        classesDetails
      }
    });

  } catch (err) {
    console.error('خطأ في جلب بيانات الغيابات:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
  // نقطة نهاية لتصدير البيانات إلى Excel
  app.get('/api/live-classes/class/:classId/attendance/export',  async (req, res) => {
    try {
        const { classId } = req.params;

        // جلب البيانات (نفس كود النقطة السابقة)
        const attendanceData = await getClassAttendanceData(classId, req.query);

        // إنشاء ملف Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('غيابات الحصة');

        // إضافة العناوين
        worksheet.columns = [
            { header: 'اسم الطالب', key: 'studentName', width: 25 },
            { header: 'رقم الطالب', key: 'studentId', width: 15 }
        ];

        // إضافة تواريخ الحصص كعناوين أعمدة
        attendanceData.liveClasses.forEach((lc, index) => {
            const dateHeader = new Date(lc.date).toLocaleDateString('ar-EG');
            worksheet.columns.push(
                { header: `${dateHeader} (حاضر)`, key: `present_${index}`, width: 12 },
                { header: `${dateHeader} (غائب)`, key: `absent_${index}`, width: 12 },
                { header: `${dateHeader} (متأخر)`, key: `late_${index}`, width: 12 }
            );
        });

        worksheet.columns.push(
            { header: 'إجمالي الحضور', key: 'totalPresent', width: 15 },
            { header: 'إجمالي الغياب', key: 'totalAbsent', width: 15 },
            { header: 'إجمالي التأخير', key: 'totalLate', width: 15 }
        );

        // إضافة البيانات
        attendanceData.students.forEach(student => {
            const rowData = {
                studentName: student.name,
                studentId: student.studentId
            };

            // بيانات كل حصة
            attendanceData.liveClasses.forEach((lc, index) => {
                const attendance = lc.attendance.find(a => a.student._id === student._id);
                rowData[`present_${index}`] = attendance?.status === 'present' ? '✓' : '';
                rowData[`absent_${index}`] = attendance?.status === 'absent' ? '✗' : '';
                rowData[`late_${index}`] = attendance?.status === 'late' ? '⌚' : '';
            });

            // الإجماليات
            rowData.totalPresent = student.statistics.present;
            rowData.totalAbsent = student.statistics.absent;
            rowData.totalLate = student.statistics.late;

            worksheet.addRow(rowData);
        });

        // إعداد الاستجابة للتحميل
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=class_attendance_${classId}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error exporting class attendance:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء التصدير' });
    }
  });

  // دالة مساعدة لجلب بيانات الغيابات
  async function getClassAttendanceData(classId, queryParams = {}) {
    const { startDate, endDate } = queryParams;

    const classObj = await Class.findById(classId)
        .populate('teacher')
        .populate('students');

    const query = { 
        class: classId,
        status: { $in: ['completed', 'ongoing'] }
    };

    if (startDate && endDate) {
        query.date = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    } else {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query.date = { $gte: thirtyDaysAgo };
    }

    const liveClasses = await LiveClass.find(query)
        .populate('attendance.student')
        .populate('classroom')
        .sort({ date: 1, startTime: 1 });

    const studentsData = classObj.students.map(student => {
        const studentStats = { present: 0, absent: 0, late: 0 };

        liveClasses.forEach(lc => {
            const attendanceRecord = lc.attendance.find(
                att => att.student._id.toString() === student._id.toString()
            );
            
            if (attendanceRecord) {
                studentStats[attendanceRecord.status]++;
            } else {
                studentStats.absent++;
            }
        });

        return {
            _id: student._id,
            name: student.name,
            studentId: student.studentId,
            statistics: studentStats
        };
    });

    return {
        class: {
            _id: classObj._id,
            name: classObj.name,
            subject: classObj.subject,
            teacher: classObj.teacher?.name
        },
        liveClasses: liveClasses.map(lc => ({
            _id: lc._id,
            date: lc.date,
            startTime: lc.startTime,
            endTime: lc.endTime,
            classroom: lc.classroom?.name,
            attendance: lc.attendance
        })),
        students: studentsData,
        summary: {
            totalClasses: liveClasses.length,
            totalStudents: classObj.students.length,
            totalPresent: studentsData.reduce((sum, student) => sum + student.statistics.present, 0),
            totalAbsent: studentsData.reduce((sum, student) => sum + student.statistics.absent, 0),
            totalLate: studentsData.reduce((sum, student) => sum + student.statistics.late, 0)
        }
    };
  }


  app.get('/api/teachers/:id/details',  async (req, res) => {
    try {
      const teacherId = req.params.id;
      
      // الحصول على بيانات الأستاذ
      const teacher = await Teacher.findById(teacherId);
      if (!teacher) {
        return res.status(404).json({ error: 'الأستاذ غير موجود' });
      }
      
      // الحصول على جميع حصص الأستاذ
      const classes = await Class.find({ teacher: teacherId })
        .populate('students')
        .populate('schedule.classroom');
      
      // الحصول على عمولات الأستاذ
      const commissions = await TeacherCommission.find({ teacher: teacherId })
        .populate('student')
        .populate('class')
        .sort({ month: -1 });
      
      // الحصول على المدفوعات التي تمت للأستاذ
      const payments = await TeacherPayment.find({ teacher: teacherId })
        .populate('student')
        .populate('class')
        .sort({ paymentDate: -1 });
      
      res.json({
        teacher,
        classes,
        commissions,
        payments
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

      app.get('/api/teachers/salaries-summary',  async (req, res) => {
      try {
        const { month } = req.query;
        const query = {};
        if (month) query.month = month;
        
        const teachers = await Teacher.find({ active: true });
        
        let totalPending = 0;
        let totalPaid = 0;
        const teachersSummary = [];
        
        for (const teacher of teachers) {
          // الحصول على عمولات الأستاذ
          const commissionsQuery = { teacher: teacher._id };
          if (month) commissionsQuery.month = month;
          
          const commissions = await TeacherCommission.find(commissionsQuery)
            .populate('class');
          
          // حساب الإجماليات
          const pendingAmount = commissions
            .filter(c => c.status === 'pending')
            .reduce((sum, c) => sum + c.amount, 0);
          
          const paidAmount = commissions
            .filter(c => c.status === 'paid')
            .reduce((sum, c) => sum + c.amount, 0);
          
          totalPending += pendingAmount;
          totalPaid += paidAmount;
          
          // الحصول على عدد الحصص والطلاب
          const classes = await Class.find({ teacher: teacher._id })
            .populate('students');
          
          const studentsCount = classes.reduce((sum, cls) => sum + cls.students.length, 0);
          
          teachersSummary.push({
            id: teacher._id,
            name: teacher.name,
            classesTaught: classes.length,
            studentsCount,
            pendingAmount,
            paidAmount,
            month: month || 'جميع الأشهر'
          });
        }
        
        res.json({
          totalPending,
          totalPaid,
          teachersCount: teachers.length,
          teachers: teachersSummary
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    
    
    // ==============================================
// ✅ نقطة نهاية جديدة: جلب أساتذة المدرسة فقط
// ==============================================


  // endpoint جديد للحصول على مدفوعات الأستاذ
  app.get('/api/teachers/:id/payments',  async (req, res) => {
    try {
      const { startDate, endDate, status } = req.query;
      const query = { teacher: req.params.id };
      
      if (status) query.status = status;
      if (startDate || endDate) {
        query.paymentDate = {};
        if (startDate) query.paymentDate.$gte = new Date(startDate);
        if (endDate) query.paymentDate.$lte = new Date(endDate);
      }
      
      const payments = await TeacherPayment.find(query)
        .populate('class')
        .populate('student')
        .sort({ paymentDate: -1 });
      
      res.json(payments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // endpoint جديد لدفع راتب الأستاذ
  app.post('/api/teachers/:id/pay-salary',  async (req, res) => {
    try {
      const { month, paymentMethod, paymentDate } = req.body;
      const teacherId = req.params.id;
      
      // الحصول على جميع عمولات الأستاذ للشهر المحدد
      const commissionsQuery = { 
        teacher: teacherId,
        status: 'pending'
      };
      
      if (month) commissionsQuery.month = month;
      
      const commissions = await TeacherCommission.find(commissionsQuery)
        .populate('class student teacher');
      
      if (commissions.length === 0) {
        return res.status(404).json({ error: 'لا توجد عمولات pending لهذا الأستاذ' });
      }
      
      let totalAmount = 0;
      const paidCommissions = [];
      
      // دفع كل عمولة على حدة
      for (const commission of commissions) {
        totalAmount += commission.amount;
        
        // تحديث حالة العمولة إلى مدفوعة
        commission.status = 'paid';
        commission.paymentDate = paymentDate || new Date();
        commission.paymentMethod = paymentMethod || 'cash';
        commission.recordedBy = req.user.id;
        await commission.save();
        
        // تسجيل المعاملة المالية (مصروف)
        const expense = new Expense({
          description: `راتب الأستاذ ${commission.teacher.name} عن الطالب ${commission.student.name} لشهر ${commission.month}`,
          amount: commission.amount,
          category: 'salary',
          type: 'teacher_payment',
          recipient: {
            type: 'teacher',
            id: commission.teacher._id,
            name: commission.teacher.name
          },
          paymentMethod: paymentMethod || 'cash',
          status: 'paid',
          recordedBy: req.user.id
        });
        await expense.save();
        
        paidCommissions.push({
          commissionId: commission._id,
          amount: commission.amount,
          student: commission.student.name
        });
      }
      
      res.json({
        message: `تم دفع راتب الأستاذ بنجاح بقيمة ${totalAmount} د.ج`,
        totalAmount,
        month: month || 'جميع الأشهر',
        paidCommissions,
        count: commissions.length
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  app.post('/api/teachers/pay-all-salaries',  async (req, res) => {
    try {
      const { month, paymentMethod, paymentDate } = req.body;
      
      const teachers = await Teacher.find({ active: true });
      let totalPaid = 0;
      let teachersCount = 0;
      let commissionsCount = 0;
      
      for (const teacher of teachers) {
        // الحصول على عمولات الأستاذ pending
        const commissionsQuery = { 
          teacher: teacher._id,
          status: 'pending'
        };
        
        if (month) commissionsQuery.month = month;
        
        const commissions = await TeacherCommission.find(commissionsQuery)
          .populate('class student teacher');
        
        if (commissions.length === 0) continue;
        
        let teacherTotal = 0;
        
        // دفع كل عمولة على حدة
        for (const commission of commissions) {
          teacherTotal += commission.amount;
          
          // تحديث حالة العمولة إلى مدفوعة
          commission.status = 'paid';
          commission.paymentDate = paymentDate || new Date();
          commission.paymentMethod = paymentMethod || 'cash';
          commission.recordedBy = req.user.id;
          await commission.save();
          
          // تسجيل المعاملة المالية (مصروف)
          const expense = new Expense({
            description: `راتب الأستاذ ${commission.teacher.name} عن الطالب ${commission.student.name} لشهر ${commission.month}`,
            amount: commission.amount,
            category: 'salary',
            type: 'teacher_payment',
            recipient: {
              type: 'teacher',
              id: commission.teacher._id,
              name: commission.teacher.name
            },
            paymentMethod: paymentMethod || 'cash',
            status: 'paid',
            recordedBy: req.user.id
          });
          await expense.save();
          
          commissionsCount++;
        }
        
        totalPaid += teacherTotal;
        teachersCount++;
      }
      
      res.json({
        message: `تم دفع رواتب ${teachersCount} أستاذ بنجاح بإجمالي ${commissionsCount} عمولة بقيمة إجمالية ${totalPaid} د.ج`,
        totalPaid,
        teachersCount,
        commissionsCount
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // إضافة نقطة نهاية جديدة لدفع عمولة فردية


  // تحسين نقطة نهاية التقارير
  app.get('/api/accounting/reports/financial',  async (req, res) => {
    try {
        const { year, month } = req.query;
        const matchStage = {};
        
        if (year) {
            matchStage.date = {
                $gte: new Date(`${year}-01-01`),
                $lte: new Date(`${year}-12-31`)
            };
        }
        
        if (month) {
            const [year, monthNum] = month.split('-');
            const startDate = new Date(year, monthNum - 1, 1);
            const endDate = new Date(year, monthNum, 0);
            matchStage.date = {
                $gte: startDate,
                $lte: endDate
            };
        }

        const report = await FinancialTransaction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        type: '$type',
                        category: '$category'
                    },
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    type: '$_id.type',
                    category: '$_id.category',
                    totalAmount: 1,
                    count: 1,
                    _id: 0
                }
            }
        ]);

        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  });


app.get('/api/students/:id', validateObjectId, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate({
        path: 'classes',
        populate: [
          { path: 'teacher', model: 'Teacher' },
          { path: 'students', model: 'Student' },
          { path: 'schedule.classroom', model: 'Classroom' }
        ]
      });
      
    if (!student) return res.status(404).json({ error: 'الطالب غير موجود' });
    
    // تأكد من أن الحصص التي يتم إرجاعها تنتمي لنفس المدرسة
    const schoolId = student.schoolId;
    const validClasses = student.classes.filter(c => 
      !schoolId || c.schoolId?.toString() === schoolId?.toString()
    );
    
    // إذا كان هناك تباين، قم بتحديث الطالب
    if (validClasses.length !== student.classes.length) {
      student.classes = validClasses.map(c => c._id);
      await student.save();
    }
    
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
    
    app.put('/api/students/:id',  async (req, res) => {
      try {
        const student = await Student.findByIdAndUpdate(
          req.params.id,
          req.body,
          { new: true }
        );
        res.json(student);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

    app.delete('/api/students/:id',  async (req, res) => {
      try {
        // Remove student from classes first
        await Class.updateMany(
          { students: req.params.id },
          { $pull: { students: req.params.id } }
        );

        // Delete associated payments, cards and attendances
        await Payment.deleteMany({ student: req.params.id });
        await Card.deleteMany({ student: req.params.id });
        await Attendance.deleteMany({ student: req.params.id });

        // Finally delete the student
        await Student.findByIdAndDelete(req.params.id);

        res.json({ message: 'تم حذف الطالب بنجاح' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Teachers
// ==============================================
// 📚 جلب أساتذة المدرسة المحددة فقط - FIXED ✅
// ==============================================

// ==============================================
// 📚 جلب أساتذة المدرسة المحددة فقط - FIXED ✅
// ==============================================

app.get('/api/teachers', async (req, res) => {
  try {
    // جلب schoolId من الـ query أو من التوكن
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    console.log('📚 جلب الأساتذة - schoolId:', schoolId);
    
    let query = {};
    
    if (schoolId) {
      // ✅ تصفية حسب schoolId
      query.schoolId = schoolId;
      console.log('🔍 تصفية الأساتذة حسب schoolId:', schoolId);
    } else {
      // ⚠️ إذا لم يكن هناك schoolId، نرجع مصفوفة فارغة
      console.warn('⚠️ لا يوجد schoolId، سيتم إرجاع قائمة فارغة');
      return res.json([]);
    }

    const teachers = await Teacher.find(query)
      .sort({ name: 1 });
    
    console.log(`✅ تم جلب ${teachers.length} أستاذ للمدرسة ${schoolId}`);
    res.json(teachers);
  } catch (err) {
    console.error('❌ خطأ في جلب الأساتذة:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});



app.post('/api/teachers', async (req, res) => {
  try {
    // جلب schoolId من التوكن (إذا كان المستخدم مسجل دخول)
    const schoolId = req.user?.schoolId || req.body.schoolId;
    
    console.log('📝 إنشاء أستاذ جديد - schoolId:', schoolId);
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    const { name, phone, email, subjects, hireDate, salaryPercentage } = req.body;
    
    // التحقق من وجود أستاذ بنفس الاسم أو الهاتف في نفس المدرسة
    const existingTeacher = await Teacher.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, 'i') } },
        { phone: phone },
        { email: email }
      ],
      schoolId: schoolId // ✅ البحث فقط في نفس المدرسة
    });

    if (existingTeacher) {
      return res.status(200).json({ 
        success: true,
        message: "الأستاذ موجود مسبقاً في هذه المدرسة",
        teacher: existingTeacher,
        existed: true
      });
    }

    // إنشاء الأستاذ الجديد مع ربطه بالمدرسة
    const teacher = new Teacher({
      schoolId: schoolId, // ✅ ربط الأستاذ بالمدرسة
      name: name,
      phone: phone || '',
      email: email || '',
      subjects: subjects || [],
      hireDate: hireDate ? new Date(hireDate) : new Date(),
      active: true,
      salaryPercentage: salaryPercentage || 0.7
    });

    await teacher.save();
    
    console.log(`✅ تم إنشاء الأستاذ: ${teacher.name} للمدرسة: ${schoolId}`);
    
    res.status(201).json({
      success: true,
      message: "تم إنشاء الأستاذ بنجاح",
      teacher: teacher,
      existed: false
    });
  } catch (err) {
    console.error('❌ خطأ في إنشاء الأستاذ:', err);
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
});

    

app.get('/api/teachers/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة'
      });
    }

    const teacher = await Teacher.findOne({
      _id: req.params.id,
      schoolId: schoolId // ✅ تأكد من أن الأستاذ ينتمي للمدرسة
    });
    
    if (!teacher) {
      return res.status(404).json({ 
        success: false,
        error: 'الأستاذ غير موجود أو لا ينتمي للمدرسة' 
      });
    }
    
    res.json(teacher);
  } catch (err) {
    console.error('❌ خطأ في جلب الأستاذ:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});


app.put('/api/teachers/:id', async (req, res) => {
  try {
    const teacherId = req.params.id;
    const { schoolId, ...updateData } = req.body;
    
    // التحقق من وجود الأستاذ
    const existingTeacher = await Teacher.findById(teacherId);
    if (!existingTeacher) {
      return res.status(404).json({
        success: false,
        error: 'الأستاذ غير موجود'
      });
    }

    // إذا تم إرسال schoolId، تحقق من صحته
    if (schoolId) {
      if (!mongoose.Types.ObjectId.isValid(schoolId)) {
        return res.status(400).json({
          success: false,
          error: 'معرف المدرسة غير صالح'
        });
      }
      
      const school = await School.findById(schoolId);
      if (!school) {
        return res.status(404).json({
          success: false,
          error: 'المدرسة غير موجودة'
        });
      }
      
      // تأكد من أن الأستاذ ينتمي للمدرسة
      if (existingTeacher.schoolId?.toString() !== schoolId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'لا يمكن تعديل أستاذ من مدرسة مختلفة'
        });
      }
    }

    // منع تحديث schoolId (يتم التحقق منه فقط)
    delete updateData.schoolId;

    const teacher = await Teacher.findByIdAndUpdate(
      teacherId,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'تم تحديث الأستاذ بنجاح',
      teacher
    });
  } catch (err) {
    console.error('❌ خطأ في تحديث الأستاذ:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});




app.delete('/api/teachers/:id', async (req, res) => {
  try {
    const teacherId = req.params.id;
    const { schoolId } = req.query;
    
    // التحقق من وجود الأستاذ
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'الأستاذ غير موجود'
      });
    }

    // إذا تم إرسال schoolId، تحقق من تطابقه مع schoolId الخاص بالأستاذ
    if (schoolId) {
      if (teacher.schoolId?.toString() !== schoolId.toString()) {
        return res.status(403).json({
          success: false,
          error: 'لا يمكن حذف أستاذ من مدرسة مختلفة'
        });
      }
    }

    // إزالة الأستاذ من الحصص
    await Class.updateMany(
      { teacher: teacherId },
      { $unset: { teacher: "" } }
    );

    // حذف الأستاذ
    await Teacher.findByIdAndDelete(teacherId);

    res.json({
      success: true,
      message: 'تم حذف الأستاذ بنجاح'
    });
  } catch (err) {
    console.error('❌ خطأ في حذف الأستاذ:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});



    // Classrooms
// ==============================================
// ROOM (CLASSROOM) MANAGEMENT WITH DELETE
// ==============================================

// ==============================================
// ROOM (CLASSROOM) MANAGEMENT WITH COMPLETE FIELDS
// ==============================================

// Get all classrooms with filtering (محدث)

// ==============================================
// CLASSROOMS API - مع دعم تعدد المدارس
// ==============================================

// جلب غرف المدرسة المحددة





app.get('/api/classrooms/my-school', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId;
    
    if (!schoolId) {
      return res.status(401).json({
        success: false,
        error: 'غير مصرح بالدخول - يرجى تسجيل الدخول'
      });
    }

    const classrooms = await Classroom.find({ schoolId: schoolId })
      .sort({ building: 1, floor: 1, name: 1 });
    
    console.log(`✅ تم جلب ${classrooms.length} غرفة للمدرسة ${schoolId}`);
    res.json(classrooms);
    
  } catch (err) {
    console.error('❌ خطأ في جلب غرف المدرسة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// إنشاء غرفة جديدة



// جلب غرفة محددة


// تحديث غرفة




// حذف غرفة



// Get single classroom (محدث)
app.get('/api/classrooms/:id', async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ error: 'الغرفة غير موجودة' });
    }
    res.json(classroom);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create classroom - مع دعم جميع الحقول (محدث)

// Update classroom - دعم جميع الحقول (محدث)


// DELETE classroom - مع التحقق من الاستخدام (محدث)
app.delete('/api/classrooms/:id', async (req, res) => {
  try {
    const classroomId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      return res.status(400).json({ 
        success: false,
        error: 'معرف الغرفة غير صالح' 
      });
    }

    // التحقق من وجود الغرفة
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ 
        success: false,
        error: 'الغرفة غير موجودة' 
      });
    }

    // التحقق من استخدام الغرفة في جدول الحصص
    const classesUsingRoom = await Class.find({
      'schedule.classroom': classroomId
    }).select('name schedule');

    if (classesUsingRoom.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'لا يمكن حذف الغرفة لأنها مستخدمة في جدول الحصص التالية',
        classes: classesUsingRoom.map(c => ({
          id: c._id,
          name: c.name,
          schedules: c.schedule.filter(s => 
            s.classroom && s.classroom.toString() === classroomId
          ).map(s => ({ day: s.day, time: s.time }))
        }))
      });
    }

    // التحقق من استخدام الغرفة في حصص حية
    const liveClassesUsingRoom = await LiveClass.find({
      classroom: classroomId,
      status: { $in: ['scheduled', 'ongoing'] }
    }).select('date startTime status');

    if (liveClassesUsingRoom.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'لا يمكن حذف الغرفة لأنها مستخدمة في حصص حية حالية أو مستقبلية',
        liveClasses: liveClassesUsingRoom.map(lc => ({
          id: lc._id,
          date: lc.date,
          startTime: lc.startTime,
          status: lc.status
        }))
      });
    }

    // حذف الغرفة
    await Classroom.findByIdAndDelete(classroomId);

    res.json({
      success: true,
      message: 'تم حذف الغرفة بنجاح',
      deletedRoom: {
        id: classroom._id,
        name: classroom.name,
        building: classroom.building,
        floor: classroom.floor,
        location: classroom.location
      }
    });

  } catch (err) {
    console.error('Error deleting classroom:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// الحصول على قائمة التجهيزات المتاحة (نقطة نهاية جديدة)
app.get('/api/classrooms/equipment-options', async (req, res) => {
  try {
    // قائمة التجهيزات الافتراضية (مطابقة لـ equipmentOptions في Angular)
    const defaultEquipment = [
      'بروجيكتور', 
      'سبورة ذكية', 
      'مكيف هواء', 
      'أجهزة كمبيوتر', 
      'نظام صوت', 
      'طابعة', 
      'شاشة تفاعلية'
    ];
    
    // جلب التجهيزات الفريدة من قاعدة البيانات
    const uniqueEquipment = await Classroom.distinct('equipment');
    
    // دمج القائمة الافتراضية مع القائمة من قاعدة البيانات
    const allEquipment = [...new Set([...defaultEquipment, ...uniqueEquipment.flat()])]
      .filter(item => item && item.trim() !== '')
      .sort();
    
    res.json(allEquipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// الحصول على إحصائيات الغرف (نقطة نهاية جديدة)
// ==============================================
// CLASSROOMS API - مع دعم تعدد المدارس وتقييد الإضافة بالمدرسة
// ==============================================

// جلب غرف المدرسة المحددة
// ==============================================
// 📚 نقاط نهاية إضافية لجلب البيانات حسب المدرسة
// ==============================================

// 1. جلب حصص مدرسة محددة
// ==============================================
// جلب حصص مدرسة محددة (بديل)
// ==============================================
app.get('/api/classes/school/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف المدرسة غير صالح'
      });
    }

    // التحقق من وجود المدرسة
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'المدرسة غير موجودة'
      });
    }

    const classes = await Class.find({ schoolId })
      .populate('teacher', 'name phone email')
      .populate('students', 'name studentId')
      .populate('schedule.classroom', 'name location')
      .sort({ createdAt: -1 });
    
    console.log(`✅ تم جلب ${classes.length} حصة للمدرسة ${schoolId}`);
    res.json(classes);
    
  } catch (err) {
    console.error('❌ خطأ في جلب حصص المدرسة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// 2. جلب أساتذة مدرسة محددة
app.get('/api/teachers/school/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف المدرسة غير صالح'
      });
    }

    const teachers = await Teacher.find({ schoolId: schoolId })
      .sort({ name: 1 });
    
    console.log(`✅ تم جلب ${teachers.length} أستاذ للمدرسة ${schoolId}`);
    res.json(teachers);
  } catch (err) {
    console.error('❌ خطأ في جلب أساتذة المدرسة:', err);
    res.status(500).json({ error: err.message });
  }
});

// 3. جلب طلاب مدرسة محددة
app.get('/api/students/school/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف المدرسة غير صالح'
      });
    }

    const students = await Student.find({ schoolId })
      .populate('classes')
      .sort({ name: 1 });
    
    res.json(students);
  } catch (err) {
    console.error('❌ خطأ في جلب طلاب المدرسة:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. جلب غرف مدرسة محددة
app.get('/api/classrooms/school/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف المدرسة غير صالح'
      });
    }

    const classrooms = await Classroom.find({ schoolId })
      .sort({ building: 1, floor: 1, name: 1 });
    
    res.json(classrooms);
  } catch (err) {
    console.error('❌ خطأ في جلب غرف المدرسة:', err);
    res.status(500).json({ error: err.message });
  }
});

// جلب جميع الغرف (مع فلترة حسب schoolId من التوكن)
// ==============================================
// 📚 جلب غرف المدرسة المحددة فقط - FIXED ✅
// ==============================================

app.get('/api/classrooms', async (req, res) => {
  try {
    // جلب schoolId من الـ query أو من التوكن
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    console.log('📚 جلب الغرف - schoolId:', schoolId);
    
    let query = {};
    
    if (schoolId) {
      // ✅ تصفية حسب schoolId
      query.schoolId = schoolId;
      console.log('🔍 تصفية الغرف حسب schoolId:', schoolId);
    } else {
      // ⚠️ إذا لم يكن هناك schoolId، نرجع مصفوفة فارغة
      console.warn('⚠️ لا يوجد schoolId، سيتم إرجاع قائمة فارغة');
      return res.json([]);
    }

    const classrooms = await Classroom.find(query)
      .sort({ building: 1, floor: 1, name: 1 });
    
    console.log(`✅ تم جلب ${classrooms.length} غرفة للمدرسة ${schoolId}`);
    res.json(classrooms);
    
  } catch (err) {
    console.error('❌ خطأ في جلب الغرف:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
// ==============================================
// ✅ إنشاء غرفة جديدة - مع التحديث المطلوب (ربط بالمدرسة)
// ==============================================
// ==============================================
// ✅ إنشاء غرفة جديدة - النسخة المصححة
// ==============================================
app.post('/api/classrooms', async (req, res) => {
  try {
    console.log('📝 استلام طلب إنشاء غرفة جديدة');
    console.log('📦 Body:', req.body);
    console.log('👤 User:', req.user);
    
    // 1. جلب schoolId من عدة مصادر (الأولوية للـ body ثم التوكن)
    const schoolId = req.body.schoolId || req.user?.schoolId;
    
    console.log('🏫 schoolId المستخدم:', schoolId);
    
    // 2. التحقق من وجود schoolId (إلزامي)
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: '❌ يجب تحديد المدرسة (schoolId) عند إضافة غرفة جديدة',
        message: 'يرجى اختيار المدرسة أولاً'
      });
    }

    // 3. التحقق من صحة schoolId
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        error: '❌ معرف المدرسة غير صالح',
        message: 'يرجى اختيار مدرسة صحيحة'
      });
    }

    // 4. التحقق من وجود المدرسة في قاعدة البيانات
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: '❌ المدرسة غير موجودة',
        message: 'المدرسة المحددة غير موجودة في النظام'
      });
    }

    // 5. استخراج بيانات الغرفة من الطلب
    const { 
      name, 
      capacity, 
      floor, 
      building, 
      location, 
      color, 
      equipment, 
      status, 
      description, 
      floorArea 
    } = req.body;

    // 6. التحقق من الحقول المطلوبة
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: '❌ اسم الغرفة مطلوب',
        message: 'يرجى إدخال اسم الغرفة'
      });
    }

    if (!capacity || capacity < 1) {
      return res.status(400).json({
        success: false,
        error: '❌ سعة الغرفة غير صالحة',
        message: 'يرجى إدخال سعة صحيحة (أكبر من 0)'
      });
    }

    // 7. التحقق من وجود غرفة بنفس الاسم في نفس المدرسة والمبنى والطابق
    const existingRoom = await Classroom.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      building: building || 'المبنى الرئيسي',
      floor: floor || 1,
      schoolId: schoolId
    });

    if (existingRoom) {
      return res.status(400).json({
        success: false,
        error: '❌ توجد غرفة بنفس الاسم في نفس المبنى والطابق',
        message: `الغرفة "${name}" موجودة مسبقاً في مدرسة ${school.name}`,
        existingRoom: {
          _id: existingRoom._id,
          name: existingRoom.name,
          building: existingRoom.building,
          floor: existingRoom.floor
        }
      });
    }

    // 8. تنظيف equipment - إزالة القيم الفارغة
    const cleanEquipment = Array.isArray(equipment) 
      ? equipment.filter(item => item && item.trim() !== '')
      : [];

    // 9. إنشاء الغرفة الجديدة مع ربطها بالمدرسة
    const classroom = new Classroom({
      schoolId: schoolId, // 🔗 ربط الغرفة بالمدرسة
      name: name.trim(),
      capacity: capacity || 30,
      floor: floor || 1,
      building: building || 'المبنى الرئيسي',
      location: location || '',
      color: color || '#4361ee',
      equipment: cleanEquipment,
      status: status || 'available',
      description: description || '',
      floorArea: floorArea || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 10. حفظ الغرفة في قاعدة البيانات
    await classroom.save();
    
    console.log(`✅ تم إنشاء الغرفة: ${classroom.name} للمدرسة: ${school.name} (${schoolId})`);
    
    // 11. إرجاع الاستجابة الناجحة مع تفاصيل المدرسة
    res.status(201).json({
      success: true,
      message: `✅ تم إنشاء الغرفة "${classroom.name}" بنجاح في مدرسة ${school.name}`,
      data: {
        classroom: {
          _id: classroom._id,
          name: classroom.name,
          capacity: classroom.capacity,
          floor: classroom.floor,
          building: classroom.building,
          location: classroom.location,
          color: classroom.color,
          equipment: classroom.equipment,
          status: classroom.status,
          description: classroom.description,
          floorArea: classroom.floorArea,
          createdAt: classroom.createdAt,
          updatedAt: classroom.updatedAt
        },
        school: {
          _id: school._id,
          name: school.name,
          email: school.email,
          phone: school.phone
        }
      },
      details: {
        schoolId: schoolId,
        schoolName: school.name,
        roomName: classroom.name
      }
    });
    
  } catch (err) {
    console.error('❌ خطأ في إنشاء الغرفة:', err);
    
    // معالجة أخطاء التحقق من صحة البيانات
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: '❌ خطأ في صحة البيانات',
        message: errors.join(', '),
        details: errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: '❌ فشل في إنشاء الغرفة',
      message: err.message
    });
  }
});

// ==============================================
// جلب غرفة محددة (مع معلومات المدرسة)
// ==============================================
app.get('/api/classrooms/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    
    const classroom = await Classroom.findOne({
      _id: req.params.id,
      ...(schoolId && { schoolId: schoolId })
    });
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: 'الغرفة غير موجودة أو لا تنتمي للمدرسة'
      });
    }
    
    // جلب معلومات المدرسة
    const school = await School.findById(classroom.schoolId).select('name email phone');
    
    res.json({
      success: true,
      data: {
        classroom: classroom,
        school: school
      }
    });
  } catch (err) {
    console.error('❌ خطأ في جلب الغرفة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// تحديث غرفة (مع التحقق من المدرسة)
// ==============================================
app.put('/api/classrooms/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || req.body.schoolId;
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة'
      });
    }

    // التحقق من أن الغرفة تنتمي للمدرسة
    const existingRoom = await Classroom.findOne({
      _id: req.params.id,
      schoolId: schoolId
    });

    if (!existingRoom) {
      return res.status(404).json({
        success: false,
        error: 'الغرفة غير موجودة أو لا تنتمي للمدرسة'
      });
    }

    // منع تحديث schoolId
    delete req.body.schoolId;

    const classroom = await Classroom.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'تم تحديث الغرفة بنجاح',
      data: classroom
    });
    
  } catch (err) {
    console.error('❌ خطأ في تحديث الغرفة:', err);
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// حذف غرفة (مع التحقق من المدرسة)
// ==============================================
app.delete('/api/classrooms/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة'
      });
    }

    // التحقق من أن الغرفة تنتمي للمدرسة
    const classroom = await Classroom.findOne({
      _id: req.params.id,
      schoolId: schoolId
    });

    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: 'الغرفة غير موجودة أو لا تنتمي للمدرسة'
      });
    }

    // التحقق من استخدام الغرفة في جدول الحصص
    const classesUsingRoom = await Class.find({
      'schedule.classroom': req.params.id
    });

    if (classesUsingRoom.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'لا يمكن حذف الغرفة لأنها مستخدمة في جدول الحصص',
        classes: classesUsingRoom.map(c => c.name)
      });
    }

    await Classroom.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'تم حذف الغرفة بنجاح'
    });
    
  } catch (err) {
    console.error('❌ خطأ في حذف الغرفة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// الحصول على إحصائيات الغرف للمدرسة المحددة
// ==============================================
app.get('/api/classrooms/statistics', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'schoolId مطلوب'
      });
    }

    const totalRooms = await Classroom.countDocuments({ schoolId: schoolId });
    const availableRooms = await Classroom.countDocuments({ schoolId: schoolId, status: 'available' });
    const occupiedRooms = await Classroom.countDocuments({ schoolId: schoolId, status: 'occupied' });
    const maintenanceRooms = await Classroom.countDocuments({ schoolId: schoolId, status: 'maintenance' });
    
    // إحصائيات حسب المبنى
    const byBuilding = await Classroom.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
      { $group: { _id: '$building', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // إحصائيات حسب الطابق
    const byFloor = await Classroom.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
      { $group: { _id: '$floor', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // أكثر التجهيزات شيوعاً
    const equipmentStats = await Classroom.aggregate([
      { $match: { schoolId: new mongoose.Types.ObjectId(schoolId) } },
      { $unwind: '$equipment' },
      { $group: { _id: '$equipment', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // معلومات المدرسة
    const school = await School.findById(schoolId).select('name');
    
    res.json({
      success: true,
      school: school?.name || 'غير محدد',
      totalRooms,
      availableRooms,
      occupiedRooms,
      maintenanceRooms,
      byBuilding,
      byFloor,
      equipmentStats
    });
  } catch (err) {
    console.error('❌ خطأ في إحصائيات الغرف:', err);
    res.status(500).json({ error: err.message });
  }
});

// Check classroom availability
app.get('/api/classrooms/:id/availability', async (req, res) => {
  try {
    const classroomId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الغرفة غير صالح'
      });
    }
    
    const classroom = await Classroom.findById(classroomId)
      .select('name status location capacity equipment');
    
    if (!classroom) {
      return res.status(404).json({
        success: false,
        error: 'الغرفة غير موجودة'
      });
    }
    
    // جلب الحصص الحالية في الغرفة
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    
    const currentLiveClass = await LiveClass.findOne({
      classroom: classroomId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: 'ongoing'
    }).populate('class', 'name subject')
      .populate('teacher', 'name');
    
    const upcomingClasses = await LiveClass.find({
      classroom: classroomId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: 'scheduled'
    }).populate('class', 'name subject')
      .populate('teacher', 'name')
      .sort({ startTime: 1 });
    
    res.json({
      success: true,
      classroom: {
        _id: classroom._id,
        name: classroom.name,
        status: classroom.status,
        location: classroom.location,
        capacity: classroom.capacity,
        equipment: classroom.equipment
      },
      currentStatus: classroom.status === 'available' ? 'متاحة' : 
                     classroom.status === 'occupied' ? 'مشغولة' : 'قيد الصيانة',
      currentLiveClass: currentLiveClass ? {
        id: currentLiveClass._id,
        className: currentLiveClass.class?.name,
        subject: currentLiveClass.class?.subject,
        teacher: currentLiveClass.teacher?.name,
        startTime: currentLiveClass.startTime,
        endTime: currentLiveClass.endTime
      } : null,
      upcomingClasses: upcomingClasses.map(lc => ({
        id: lc._id,
        className: lc.class?.name,
        subject: lc.class?.subject,
        teacher: lc.teacher?.name,
        startTime: lc.startTime
      }))
    });
    
  } catch (err) {
    console.error('Error checking classroom availability:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
// Get classroom schedule (محدث)
app.get('/api/classrooms/:id/schedule', async (req, res) => {
  try {
    const classroomId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(classroomId)) {
      return res.status(400).json({ error: 'معرف الغرفة غير صالح' });
    }

    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'الغرفة غير موجودة' });
    }

    // جلب جميع الحصص التي تستخدم هذه الغرفة
    const classes = await Class.find({
      'schedule.classroom': classroomId
    })
      .populate('teacher', 'name')
      .populate('students', 'name');

    const schedule = [];
    const dayOrder = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];

    classes.forEach(cls => {
      cls.schedule.forEach(session => {
        if (session.classroom && session.classroom.toString() === classroomId) {
          schedule.push({
            classId: cls._id,
            className: cls.name,
            subject: cls.subject,
            teacher: cls.teacher?.name || 'غير محدد',
            day: session.day,
            time: session.time,
            studentsCount: cls.students?.length || 0
          });
        }
      });
    });

    // ترتيب حسب اليوم والوقت
    schedule.sort((a, b) => {
      const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
      if (dayDiff !== 0) return dayDiff;
      return a.time.localeCompare(b.time);
    });

    res.json({
      classroom: {
        _id: classroom._id,
        name: classroom.name,
        building: classroom.building,
        floor: classroom.floor,
        location: classroom.location
      },
      schedule
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get classroom statistics (محدث)
app.get('/api/classrooms/:id/stats', async (req, res) => {
  try {
    const classroomId = req.params.id;
    
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      return res.status(404).json({ error: 'الغرفة غير موجودة' });
    }

    // عدد الحصص التي تستخدم هذه الغرفة
    const classCount = await Class.countDocuments({
      'schedule.classroom': classroomId
    });

    // الحصص القادمة
    const today = new Date();
    const dayNames = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const currentDay = dayNames[today.getDay()];

    const upcomingClasses = await Class.find({
      'schedule.classroom': classroomId,
      'schedule.day': currentDay
    })
      .populate('teacher', 'name')
      .limit(5);

    // إحصائيات استخدام الغرفة
    const usageStats = await Class.aggregate([
      { $unwind: '$schedule' },
      { $match: { 'schedule.classroom': new mongoose.Types.ObjectId(classroomId) } },
      { $group: { _id: '$schedule.day', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      classroom,
      stats: {
        totalClasses: classCount,
        usageByDay: usageStats,
        upcomingClasses: upcomingClasses.map(c => ({
          name: c.name,
          time: c.schedule.find(s => s.classroom?.toString() === classroomId)?.time,
          teacher: c.teacher?.name
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bulk update classroom status (نقطة نهاية جديدة)
app.patch('/api/classrooms/bulk-status', async (req, res) => {
  try {
    const { ids, status } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'يجب توفير مصفوفة من معرفات الغرف وحالة جديدة'
      });
    }

    if (!['available', 'occupied', 'maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'حالة غير صالحة'
      });
    }

    const result = await Classroom.updateMany(
      { _id: { $in: ids } },
      { status, updatedAt: new Date() }
    );

    res.json({
      success: true,
      message: `تم تحديث حالة ${result.modifiedCount} غرفة بنجاح`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Get classrooms with availability check (نقطة نهاية جديدة)
app.get('/api/classrooms/available-for-schedule', async (req, res) => {
  try {
    const { date, startTime, endTime, day } = req.query;
    
    // جلب جميع الغرف المتاحة
    const availableRooms = await Classroom.find({ 
      status: { $ne: 'maintenance' } 
    });

    // إذا تم تحديد وقت، تحقق من الجدولة
    let scheduledRooms = [];
    if (day && startTime) {
      scheduledRooms = await Class.find({
        'schedule.day': day,
        'schedule.time': startTime
      }).distinct('schedule.classroom');
    }

    const roomsWithAvailability = availableRooms.map(room => {
      const isScheduled = scheduledRooms.some(
        id => id.toString() === room._id.toString()
      );
      
      return {
        ...room.toObject(),
        isAvailable: !isScheduled && room.status === 'available'
      };
    });

    res.json(roomsWithAvailability);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

    // Classes


  // In your server.js, add logging to the /api/classes POST endpoint:
  // تأكد من أن هذا الكود موجود في نقطة /api/classes POST
  app.post('/api/classes',  async (req, res) => {
    try {
      console.log('Received class creation request:', req.body);
      
      const { name, subject, teacher, academicYear } = req.body;
      
      // التحقق من وجود حصة بنفس الاسم والمادة والأستاذ والسنة الدراسية
      const existingClass = await Class.findOne({
        name,
        subject,
        teacher,
        academicYear
      });

      if (existingClass) {
        return res.status(200).json({ 
          message: "تم تحديث المعلومات بنجاح",
          class: existingClass,
          existed: true
        });
      }

      // التحقق من بيانات نظام الدفع
      if (req.body.paymentSystem && !['monthly', 'rounds'].includes(req.body.paymentSystem)) {
        return res.status(400).json({ error: 'نظام الدفع غير صالح' });
      }

      // التحقق من إعدادات الجولات
      if (req.body.paymentSystem === 'rounds' && req.body.roundSettings) {
        if (!req.body.roundSettings.sessionCount || req.body.roundSettings.sessionCount < 1) {
          return res.status(400).json({ error: 'يجب تحديد عدد جلسات صحيح للنظام الجولاتي' });
        }
      }

      console.log('Creating new class with data:', req.body);
      
      const classObj = new Class(req.body);
      await classObj.save();
      
      // Populate the class data
      const populatedClass = await Class.findById(classObj._id)
        .populate('teacher')
        .populate('schedule.classroom');
      
      res.status(201).json({
        message: "تم إنشاء الحصة بنجاح",
        class: populatedClass,
        existed: false
      });
    } catch (err) {
      console.error('Error creating class:', err);
      console.error('Error details:', err.message, err.errors);
      
      let errorMessage = err.message;
      if (err.name === 'ValidationError') {
        errorMessage = 'خطأ في البيانات: ';
        for (const field in err.errors) {
          errorMessage += `${field}: ${err.errors[field].message}; `;
        }
      }
      
      res.status(400).json({ error: errorMessage });
    }
  });


  // In your server.js file, change the authenticate middleware for this endpoint:
// ==============================================
// 📚 GET CLASS DETAILS - مع تصفية حسب المدرسة
// ==============================================
// ==============================================
// 📚 GET CLASS DETAILS - مع تصفية حسب المدرسة
// ==============================================

// ==============================================
// 📚 GET CLASS DETAILS - مع تصفية حسب المدرسة
// ==============================================

app.get('/api/classes/:id', async (req, res) => {
  try {
    const classId = req.params.id;
    const schoolId = req.user?.schoolId || req.query.schoolId;
    
    console.log(`📚 جلب تفاصيل الحصة: ${classId}`);
    console.log(`🏫 schoolId: ${schoolId}`);
    
    // التحقق من صحة المعرف
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الحصة غير صالح'
      });
    }

    // ✅ جلب الحصة مع تصفية حسب المدرسة
    const query = { _id: classId };
    if (schoolId) {
      query.schoolId = schoolId;
    }

    const classObj = await Class.findOne(query)
      .populate('teacher', 'name phone email')
      .populate({
        path: 'students',
        match: schoolId ? { schoolId: schoolId } : {}, // ✅ تصفية الطلاب حسب المدرسة
        populate: {
          path: 'classes',
          model: 'Class'
        }
      })
      .populate('schedule.classroom', 'name location capacity');

    if (!classObj) {
      return res.status(404).json({
        success: false,
        error: 'الحصة غير موجودة أو لا تنتمي للمدرسة'
      });
    }

    // ✅ تأكد من أن students هي مصفوفة
    if (!classObj.students) {
      classObj.students = [];
    }

    console.log(`✅ تم جلب ${classObj.students.length} طالب للحصة`);

    res.json({
      success: true,
      data: classObj
    });

  } catch (err) {
    console.error('❌ خطأ في جلب تفاصيل الحصة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});



// ==============================================
// ✅ UPDATE CLASS - متوافق مع المدرسة (School ID)
// ==============================================
app.put('/api/classes/:id', async (req, res) => {
  try {
    const classId = req.params.id;
    const schoolId = req.user?.schoolId || req.body.schoolId;
    
    console.log(`📝 تحديث الحصة: ${classId}`);
    console.log(`🏫 schoolId: ${schoolId}`);
    
    // ✅ التحقق من صحة المعرف
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الحصة غير صالح'
      });
    }

    // ✅ التحقق من وجود schoolId
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    // ✅ التحقق من أن الحصة تنتمي للمدرسة
    const existingClass = await Class.findOne({
      _id: classId,
      schoolId: schoolId
    });

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        error: 'الحصة غير موجودة أو لا تنتمي للمدرسة'
      });
    }

    // ✅ استخراج البيانات القابلة للتحديث
    const { 
      name, 
      subject, 
      academicYear, 
      teacher, 
      price, 
      description, 
      schedule, 
      paymentSystem, 
      roundSettings,
      schoolId: bodySchoolId // تجاهل schoolId من body
    } = req.body;

    // ✅ التحقق من وجود أستاذ (إذا تم تحديده)
    if (teacher) {
      const teacherExists = await Teacher.findOne({ 
        _id: teacher, 
        schoolId: schoolId 
      });
      
      if (!teacherExists) {
        return res.status(400).json({
          success: false,
          error: 'الأستاذ غير موجود أو لا ينتمي للمدرسة'
        });
      }
    }

    // ✅ تحديث الحصة
    const updateData = {
      name: name || existingClass.name,
      subject: subject || existingClass.subject,
      academicYear: academicYear || existingClass.academicYear,
      teacher: teacher || existingClass.teacher,
      price: price !== undefined ? price : existingClass.price,
      description: description !== undefined ? description : existingClass.description,
      schedule: schedule !== undefined ? schedule : existingClass.schedule,
      paymentSystem: paymentSystem || existingClass.paymentSystem || 'monthly',
      roundSettings: roundSettings || existingClass.roundSettings || {
        sessionCount: 8,
        sessionDuration: 2,
        breakBetweenSessions: 0
      }
    };

    // ✅ إزالة schoolId من بيانات التحديث (لأنها غير مسموحة)
    delete updateData.schoolId;

    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('teacher', 'name phone email')
      .populate('students', 'name studentId')
      .populate('schedule.classroom', 'name location capacity');

    console.log(`✅ تم تحديث الحصة: ${updatedClass.name}`);

    // ✅ إرجاع الاستجابة
    res.json({
      success: true,
      message: 'تم تحديث الحصة بنجاح',
      data: updatedClass
    });

  } catch (err) {
    console.error('❌ خطأ في تحديث الحصة:', err);
    
    // معالجة أخطاء التحقق
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'خطأ في صحة البيانات',
        details: errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'فشل في تحديث الحصة: ' + err.message
    });
  }
});


    app.delete('/api/classes/:id',  async (req, res) => {
      try {
        // Remove class from students first
        await Student.updateMany(
          { classes: req.params.id },
          { $pull: { classes: req.params.id } }
        );

        // Delete associated payments and attendances
        await Payment.deleteMany({ class: req.params.id });
        await Attendance.deleteMany({ class: req.params.id });

        // Delete the class
        await Class.findByIdAndDelete(req.params.id);

        res.json({ message: 'تم حذف الحصة بنجاح' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
app.delete('/api/classes/:id', async (req, res) => {
  try {
    const schoolId = req.user?.schoolId || req.query.schoolId;
    
    // التحقق من أن الحصة تنتمي للمدرسة
    const classObj = await Class.findOne({
      _id: req.params.id,
      schoolId: schoolId
    });

    if (!classObj) {
      return res.status(404).json({
        success: false,
        error: 'الحصة غير موجودة أو لا تنتمي للمدرسة'
      });
    }

    // إزالة الحصة من الطلاب
    await Student.updateMany(
      { classes: req.params.id },
      { $pull: { classes: req.params.id } }
    );

    // حذف المدفوعات المرتبطة
    await Payment.deleteMany({ class: req.params.id });
    await Attendance.deleteMany({ class: req.params.id });

    // حذف الحصة
    await Class.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'تم حذف الحصة بنجاح'
    });
    
  } catch (err) {
    console.error('❌ خطأ في حذف الحصة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


    // دالة مساعدة لإنشاء نظام الدفع الشهري
// ==============================================
// دالة إنشاء الدفعات الشهرية - مع schoolId
// ==============================================
async function createMonthlyPaymentSystem(studentId, classId, price, startDate, recordedById, notes = '') {
  try {
    console.log(`[إنشاء شهري] للطالب: ${studentId}, الحصة: ${classId}, السعر: ${price}`);
    
    // 🔥 جلب schoolId من الطالب أو الحصة
    const student = await Student.findById(studentId);
    const classObj = await Class.findById(classId);
    
    // ✅ تحديد schoolId من الطالب أو الحصة
    let schoolId = student?.schoolId || classObj?.schoolId;
    
    if (!schoolId) {
      console.error('❌ لا يوجد schoolId للطالب أو الحصة');
      return { success: false, error: 'schoolId غير موجود' };
    }
    
    console.log(`🏫 schoolId المستخدم: ${schoolId}`);
    
    const currentDate = moment(startDate);
    const months = [];
    
    // إنشاء 12 دفعة شهرية
    for (let i = 0; i < 12; i++) {
      const monthDate = moment(startDate).add(i, 'months');
      const monthStr = monthDate.format('YYYY-MM');
      const monthName = monthDate.locale('ar').format('MMMM YYYY');
      months.push({ month: monthStr, name: monthName });
    }

    const createdPayments = [];
    for (const month of months) {
      const paymentExists = await Payment.findOne({
        student: studentId,
        class: classId,
        month: month.month
      });

      if (!paymentExists) {
        const payment = new Payment({
          student: studentId,
          class: classId,
          schoolId: schoolId, // ✅ إضافة schoolId هنا
          amount: price,
          month: month.name,
          monthCode: month.month,
          status: moment(month.month, 'YYYY-MM').isBefore(moment(), 'month') ? 'late' : 'pending',
          recordedBy: recordedById,
          paymentMethod: 'cash',
          notes: notes || `دفعة شهرية لشهر ${month.name}`
        });

        await payment.save();
        createdPayments.push(payment);
        
        console.log(`✅ تم إنشاء دفعة شهرية: ${month.name} - ${price} د.ج (schoolId: ${schoolId})`);
        
        // تسجيل المعاملة المالية
        if (recordedById) {
          const transaction = new FinancialTransaction({
            type: 'income',
            amount: price,
            description: `دفعة متوقعة للطالب في الحصة ${classId} لشهر ${month.name}`,
            category: 'tuition',
            recordedBy: recordedById,
            reference: payment._id,
            schoolId: schoolId // ✅ إضافة schoolId هنا أيضاً
          });
          await transaction.save();
        }
      }
    }
    
    return {
      success: true,
      type: 'monthly',
      payments: createdPayments,
      months: months.length,
      totalAmount: price * months.length,
      message: `تم إنشاء ${createdPayments.length} دفعة شهرية`
    };
  } catch (err) {
    console.error('❌ خطأ في إنشاء الدفعات الشهرية:', err);
    return {
      success: false,
      error: err.message
    };
  }
}
    
  // دالة مساعدة لإنشاء نظام الجولات
// ==============================================
// دالة إنشاء نظام الجولات - مع schoolId
// ==============================================
async function createRoundPaymentSystem(studentId, classId, price, roundSettings, startDate, recordedById, notes = '') {
  try {
    console.log(`[إنشاء جولات] للطالب: ${studentId}, الحصة: ${classId}`);
    
    // 🔥 جلب schoolId من الطالب أو الحصة
    const student = await Student.findById(studentId);
    const classObj = await Class.findById(classId);
    
    let schoolId = student?.schoolId || classObj?.schoolId;
    
    if (!schoolId) {
      console.error('❌ لا يوجد schoolId للطالب أو الحصة');
      return { success: false, error: 'schoolId غير موجود' };
    }
    
    console.log(`🏫 schoolId المستخدم للجولات: ${schoolId}`);
    
    const { sessionCount = 8, sessionDuration = 2, breakBetweenSessions = 0 } = roundSettings;
    
    // Calculate price per session
    const sessionPrice = Math.round(price / sessionCount);
    const totalAmount = sessionPrice * sessionCount;
    
    // Calculate session dates
    const sessions = [];
    let currentSessionDate = moment(startDate);
    
    for (let i = 1; i <= sessionCount; i++) {
      sessions.push({
        sessionNumber: i,
        date: currentSessionDate.toDate(),
        price: sessionPrice,
        status: 'pending',
        notes: `الجلسة ${i} من ${sessionCount}`
      });
      
      currentSessionDate.add(sessionDuration + breakBetweenSessions, 'hours');
    }
    
    const endDate = currentSessionDate.toDate();
    
    // Create round record
    const roundPayment = new RoundPayment({
      student: studentId,
      class: classId,
      schoolId: schoolId, // ✅ إضافة schoolId
      roundNumber: `RND-${Date.now().toString().slice(-6)}`,
      sessionCount: sessionCount,
      sessionPrice: sessionPrice,
      totalAmount: totalAmount,
      startDate: startDate,
      endDate: endDate,
      sessions: sessions,
      status: 'pending',
      recordedBy: recordedById,
      notes: notes || `نظام جولات: ${sessionCount} جلسة`
    });
    
    await roundPayment.save();
    
    // Create one payment for the round
    const payment = new Payment({
      student: studentId,
      class: classId,
      schoolId: schoolId, // ✅ إضافة schoolId
      amount: totalAmount,
      month: `جولة ${roundPayment.roundNumber}`,
      monthCode: moment().format('YYYY-MM'),
      status: 'pending',
      recordedBy: recordedById,
      paymentMethod: 'cash',
      notes: `دفعة جولة ${roundPayment.roundNumber} - ${sessionCount} جلسة`
    });
    
    await payment.save();
    
    console.log(`✅ تم إنشاء جولة: ${roundPayment.roundNumber} - ${totalAmount} د.ج (schoolId: ${schoolId})`);
    
    return {
      success: true,
      type: 'rounds',
      roundId: roundPayment._id,
      roundNumber: roundPayment.roundNumber,
      sessionCount: sessionCount,
      totalAmount: totalAmount,
      paymentId: payment._id,
      message: `تم إنشاء جولة ${roundPayment.roundNumber} بـ ${sessionCount} جلسة`
    };
  } catch (err) {
    console.error('❌ خطأ في إنشاء نظام الجولات:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

// ==============================================
// ✅ إلغاء دفع حقوق التسجيل للطالب
// ==============================================
// ==============================================
// ✅ إلغاء دفع حقوق التسجيل للطالب
// ==============================================
app.put('/api/students/:id/cancel-registration', async (req, res) => {
  try {
    const studentId = req.params.id;
    const { reason } = req.body;
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    console.log(`🔄 إلغاء دفع حقوق التسجيل للطالب: ${studentId}`);
    console.log(`📝 سبب الإلغاء: ${reason || 'غير محدد'}`);
    console.log(`🏫 المدرسة: ${schoolId}`);

    // ✅ التحقق من وجود schoolId
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    // ✅ التحقق من صحة المعرف
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الطالب غير صالح'
      });
    }

    // ✅ البحث عن الطالب مع التحقق من المدرسة
    const student = await Student.findOne({
      _id: studentId,
      schoolId: schoolId
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'الطالب غير موجود أو لا ينتمي للمدرسة'
      });
    }

    // ✅ التحقق من أن الطالب قد دفع حقوق التسجيل
    if (!student.hasPaidRegistration) {
      return res.status(400).json({
        success: false,
        error: 'الطالب لم يدفع حقوق التسجيل بعد'
      });
    }

    // ✅ تحديث حالة الدفع
    student.hasPaidRegistration = false;
    student.status = 'pending';
    student.active = true;
    await student.save();

    console.log(`✅ تم إلغاء دفع حقوق التسجيل للطالب: ${student.name}`);

    // ✅ تحديث سجل رسوم التسجيل
    const schoolFee = await SchoolFee.findOne({
      student: studentId,
      schoolId: schoolId,
      status: 'paid'
    }).sort({ paymentDate: -1 });

    if (schoolFee) {
      schoolFee.status = 'pending';
      schoolFee.paymentDate = null;
      schoolFee.paymentMethod = null;
      schoolFee.invoiceNumber = null;
      schoolFee.notes = `إلغاء الدفع: ${reason || 'لم يتم تحديد سبب'}`;
      await schoolFee.save();
      console.log(`✅ تم تحديث سجل رسوم التسجيل: ${schoolFee._id}`);
    }

    // ✅ إلغاء المعاملة المالية المرتبطة - الطريقة الصحيحة
    const transaction = await FinancialTransaction.findOne({
      reference: schoolFee?._id,
      type: 'income',
      schoolId: schoolId
    });

    if (transaction) {
      // ✅ بدلاً من تغيير النوع إلى refund، نقوم بإنشاء معاملة جديدة من نوع refund
      // ونحتفظ بالمعاملة الأصلية كمرجع
      
      // 1. إنشاء معاملة استرداد جديدة
      const refundTransaction = new FinancialTransaction({
        schoolId: schoolId,
        type: 'refund', // ✅ الآن هذا مسموح به بعد تحديث الـ Schema
        amount: transaction.amount,
        description: `استرداد رسوم تسجيل الطالب ${student.name} - ${reason || ''}`,
        category: 'refund',
        date: new Date(),
        recordedBy: req.user?.id || null,
        reference: transaction._id, // ربط بالمعاملة الأصلية
        student: student._id
      });
      await refundTransaction.save();
      
      console.log(`✅ تم إنشاء معاملة استرداد جديدة: ${refundTransaction._id}`);
      
      // 2. (اختياري) تحديث المعاملة الأصلية للإشارة إلى أنها تم استردادها
      transaction.category = 'refunded';
      transaction.notes = `تم استرداد المبلغ - ${reason || ''}`;
      await transaction.save();
    }

    // ✅ تسجيل عملية الإلغاء في سجل الرسائل (اختياري)
    try {
      const messageRecord = new Message({
        sender: req.user?.id || null,
        recipients: [{
          student: student._id,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail
        }],
        content: `تم إلغاء دفع رسوم التسجيل للطالب ${student.name} - ${reason || 'لم يتم تحديد سبب'}`,
        messageType: 'individual',
        status: 'sent'
      });
      await messageRecord.save({ validateBeforeSave: false });
    } catch (msgError) {
      console.warn('⚠️ لم يتم حفظ سجل الرسالة:', msgError.message);
    }

    // ✅ إرجاع الاستجابة
    res.json({
      success: true,
      message: 'تم إلغاء دفع حقوق التسجيل بنجاح',
      student: {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
        hasPaidRegistration: student.hasPaidRegistration,
        status: student.status
      },
      reason: reason || 'لم يتم تحديد سبب',
      schoolId: schoolId,
      refundTransaction: transaction ? {
        _id: transaction._id,
        amount: transaction.amount,
        type: 'refund'
      } : null
    });

  } catch (err) {
    console.error('❌ خطأ في إلغاء دفع حقوق التسجيل:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 📅 نظام الجدولة التلقائية للحصص الحية
// ==============================================

// ==============================================
// 1. دالة إنشاء الحصص الحية لليوم المحدد
// ==============================================
async function createLiveClassesForDate(targetDate, schoolId = null) {
  try {
    console.log(`📅 بدء إنشاء الحصص الحية لتاريخ: ${targetDate.toISOString().split('T')[0]}`);
    
    // الحصول على يوم الأسبوع بالعربية
    const daysMap = {
      0: 'الأحد',
      1: 'الإثنين',
      2: 'الثلاثاء',
      3: 'الأربعاء',
      4: 'الخميس',
      5: 'الجمعة',
      6: 'السبت'
    };
    const dayName = daysMap[targetDate.getDay()];
    
    console.log(`📅 اليوم: ${dayName}`);
    
    // بناء استعلام للحصص
    let classQuery = {
      'schedule.day': dayName
    };
    
    // إذا تم تحديد مدرسة، أضف التصفية
    if (schoolId) {
      classQuery.schoolId = schoolId;
    }
    
    // جلب جميع الحصص التي لها جدول في هذا اليوم
    const classes = await Class.find(classQuery)
      .populate('teacher', 'name phone email')
      .populate('students', 'name studentId parentPhone')
      .populate('schedule.classroom', 'name location');
    
    console.log(`📚 تم العثور على ${classes.length} حصة مجدولة ليوم ${dayName}`);
    
    const results = {
      created: 0,
      skipped: 0,
      failed: 0,
      details: []
    };
    
    // بداية ونهاية اليوم
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    for (const classObj of classes) {
      try {
        // التحقق من وجود حصة حية مسبقاً لهذا اليوم
        const existingLiveClass = await LiveClass.findOne({
          class: classObj._id,
          date: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        });
        
        if (existingLiveClass) {
          console.log(`⏭️ حصة ${classObj.name} موجودة مسبقاً، تخطي`);
          results.skipped++;
          results.details.push({
            classId: classObj._id,
            className: classObj.name,
            status: 'مجدولة مسبقاً',
            liveClassId: existingLiveClass._id
          });
          continue;
        }
        
        // العثور على الجدول المناسب لهذا اليوم
        const scheduleEntry = classObj.schedule.find(s => s.day === dayName);
        
        if (!scheduleEntry) {
          console.log(`⚠️ لا يوجد جدول للحصة ${classObj.name} في يوم ${dayName}`);
          results.failed++;
          results.details.push({
            classId: classObj._id,
            className: classObj.name,
            status: 'لا يوجد جدول لهذا اليوم'
          });
          continue;
        }
        
        // حساب وقت النهاية (افتراضي: ساعتين بعد البداية)
        const startTime = scheduleEntry.time || '08:00';
        const [hour, minute] = startTime.split(':').map(Number);
        const endHour = hour + 2;
        const endTime = `${endHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        
        // إنشاء سجلات الحضور للطلاب
        const attendance = classObj.students.map(student => ({
          student: student._id,
          status: 'absent',
          joinedAt: null,
          leftAt: null,
          timestamp: new Date(),
          method: 'auto'
        }));
        
        // إنشاء الحصة الحية
        const liveClass = new LiveClass({
          schoolId: classObj.schoolId,
          class: classObj._id,
          date: targetDate,
          month: targetDate.toISOString().slice(0, 7),
          startTime: startTime,
          endTime: endTime,
          teacher: classObj.teacher?._id,
          classroom: scheduleEntry.classroom,
          attendance: attendance,
          status: 'scheduled',
          notes: `تم إنشاؤها تلقائياً في ${new Date().toLocaleString()}`,
          createdBy: null // تم إنشاؤها بواسطة النظام
        });
        
        await liveClass.save();
        console.log(`✅ تم إنشاء حصة حية: ${classObj.name} - ${startTime}`);
        
        results.created++;
        results.details.push({
          classId: classObj._id,
          className: classObj.name,
          subject: classObj.subject,
          teacher: classObj.teacher?.name || 'غير محدد',
          time: startTime,
          studentsCount: classObj.students.length,
          status: 'تم الإنشاء',
          liveClassId: liveClass._id
        });
        
      } catch (err) {
        console.error(`❌ خطأ في إنشاء حصة ${classObj.name}:`, err.message);
        results.failed++;
        results.details.push({
          classId: classObj._id,
          className: classObj.name,
          status: 'فشل الإنشاء',
          error: err.message
        });
      }
    }
    
    return results;
    
  } catch (err) {
    console.error('❌ خطأ في دالة إنشاء الحصص:', err);
    return {
      created: 0,
      skipped: 0,
      failed: 0,
      details: [],
      error: err.message
    };
  }
}

// ==============================================
// 2. دالة إنشاء الحصص لجميع المدارس
// ==============================================
async function createLiveClassesForAllSchools(targetDate) {
  try {
    console.log(`🏫 إنشاء حصص لجميع المدارس بتاريخ ${targetDate.toISOString().split('T')[0]}`);
    
    // جلب جميع المدارس النشطة
    const schools = await School.find({ status: 'active' });
    console.log(`🏫 عدد المدارس النشطة: ${schools.length}`);
    
    const allResults = {
      totalSchools: schools.length,
      processedSchools: 0,
      totalCreated: 0,
      totalSkipped: 0,
      totalFailed: 0,
      schools: []
    };
    
    for (const school of schools) {
      console.log(`\n🏫 معالجة مدرسة: ${school.name} (${school.schoolKey})`);
      
      // التحقق من صلاحية الاشتراك
      if (!school.isSubscriptionActive()) {
        console.log(`⚠️ اشتراك المدرسة ${school.name} غير نشط، تخطي`);
        allResults.schools.push({
          schoolId: school._id,
          schoolName: school.name,
          status: 'اشتراك غير نشط',
          created: 0,
          skipped: 0,
          failed: 0
        });
        continue;
      }
      
      const results = await createLiveClassesForDate(targetDate, school._id);
      
      allResults.processedSchools++;
      allResults.totalCreated += results.created || 0;
      allResults.totalSkipped += results.skipped || 0;
      allResults.totalFailed += results.failed || 0;
      
      allResults.schools.push({
        schoolId: school._id,
        schoolName: school.name,
        status: 'تم المعالجة',
        created: results.created || 0,
        skipped: results.skipped || 0,
        failed: results.failed || 0,
        details: results.details || []
      });
    }
    
    return allResults;
    
  } catch (err) {
    console.error('❌ خطأ في إنشاء حصص لجميع المدارس:', err);
    return {
      totalSchools: 0,
      processedSchools: 0,
      totalCreated: 0,
      totalSkipped: 0,
      totalFailed: 0,
      schools: [],
      error: err.message
    };
  }
}

// ==============================================
// 3. دالة إرسال التقرير اليومي
// ==============================================
async function sendDailyScheduleReport(results, targetDate) {
  try {
    console.log(`📧 إرسال تقرير الجدولة اليومي`);
    
    // إعداد التقرير
    const dateStr = targetDate.toISOString().split('T')[0];
    const formattedDate = new Date(dateStr).toLocaleDateString('ar-EG', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    let reportText = `📅 تقرير الجدولة التلقائية للحصص الحية\n`;
    reportText += `📆 التاريخ: ${formattedDate}\n`;
    reportText += `🕐 وقت التقرير: ${new Date().toLocaleString()}\n`;
    reportText += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    reportText += `📊 ملخص النتائج:\n`;
    reportText += `   ✅ تم إنشاء: ${results.totalCreated} حصة\n`;
    reportText += `   ⏭️ تم تخطي: ${results.totalSkipped} حصة\n`;
    reportText += `   ❌ فشل: ${results.totalFailed} حصة\n`;
    reportText += `   🏫 تم معالجة: ${results.processedSchools} مدرسة\n\n`;
    
    if (results.schools && results.schools.length > 0) {
      reportText += `📋 تفاصيل المدارس:\n`;
      for (const school of results.schools) {
        reportText += `\n🏫 ${school.schoolName}:\n`;
        reportText += `   ✅ ${school.created || 0} حصة تم إنشاؤها\n`;
        reportText += `   ⏭️ ${school.skipped || 0} حصة تخطي\n`;
        reportText += `   ❌ ${school.failed || 0} حصة فشل\n`;
        
        if (school.details && school.details.length > 0) {
          const createdDetails = school.details.filter(d => d.status === 'تم الإنشاء');
          if (createdDetails.length > 0) {
            reportText += `   📚 الحصص المنشأة:\n`;
            for (const d of createdDetails.slice(0, 5)) {
              reportText += `      - ${d.className} (${d.time || 'غير محدد'}) - ${d.studentsCount || 0} طالب\n`;
            }
            if (createdDetails.length > 5) {
              reportText += `      ... و ${createdDetails.length - 5} حصص أخرى\n`;
            }
          }
        }
      }
    }
    
    if (results.error) {
      reportText += `\n⚠️ أخطاء: ${results.error}\n`;
    }
    
    console.log('📧 التقرير:');
    console.log(reportText);
    
    // تسجيل التقرير في قاعدة البيانات (اختياري)
    try {
      const reportRecord = new Message({
        sender: null,
        recipients: [],
        content: reportText,
        messageType: 'system',
        status: 'sent'
      });
      await reportRecord.save({ validateBeforeSave: false });
      console.log(`✅ تم تسجيل التقرير في قاعدة البيانات: ${reportRecord._id}`);
    } catch (err) {
      console.error('⚠️ فشل في تسجيل التقرير:', err.message);
    }
    
    return {
      success: true,
      reportText: reportText
    };
    
  } catch (err) {
    console.error('❌ خطأ في إرسال التقرير:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

// ==============================================
// 4. دالة الجدولة الرئيسية
// ==============================================
async function runDailySchedule() {
  try {
    console.log('\n' + '='.repeat(60));
    console.log(`🔄 بدء الجدولة التلقائية في ${new Date().toLocaleString()}`);
    console.log('='.repeat(60));
    
    // التاريخ المستهدف: اليوم
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // إنشاء الحصص لجميع المدارس
    const results = await createLiveClassesForAllSchools(today);
    
    console.log('\n📊 ملخص النتائج:');
    console.log(`   ✅ تم إنشاء: ${results.totalCreated} حصة`);
    console.log(`   ⏭️ تم تخطي: ${results.totalSkipped} حصة`);
    console.log(`   ❌ فشل: ${results.totalFailed} حصة`);
    console.log(`   🏫 تم معالجة: ${results.processedSchools} مدرسة`);
    
    // إرسال التقرير
    await sendDailyScheduleReport(results, today);
    
    console.log('='.repeat(60));
    console.log(`✅ اكتملت الجدولة التلقائية في ${new Date().toLocaleString()}`);
    console.log('='.repeat(60) + '\n');
    
    return results;
    
  } catch (err) {
    console.error('❌ خطأ في الجدولة التلقائية:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

// ==============================================
// 5. جدولة المهام التلقائية
// ==============================================

// تشغيل الجدولة فور بدء الخادم (للتأكد من إنشاء حصص اليوم)
setTimeout(async () => {
  console.log('🚀 بدء الجدولة التلقائية عند بدء الخادم...');
  await runDailySchedule();
}, 5000); // تأخير 5 ثوانٍ لضمان اكتمال اتصال قاعدة البيانات

// جدولة الجدولة كل يوم في الساعة 5:00 صباحاً
function scheduleDailyJob() {
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(5, 0, 0, 0); // 5:00 صباحاً
  
  // إذا كان الوقت قد تجاوز 5:00 صباحاً، جدولة لليوم التالي
  if (now > scheduledTime) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  const timeUntilSchedule = scheduledTime.getTime() - now.getTime();
  
  console.log(`⏰ سيتم تشغيل الجدولة التلقائية في ${scheduledTime.toLocaleString()}`);
  console.log(`⏱️ الوقت المتبقي: ${Math.round(timeUntilSchedule / 1000 / 60)} دقيقة`);
  
  setTimeout(() => {
    // تشغيل الجدولة
    runDailySchedule();
    
    // إعادة الجدولة لليوم التالي
    scheduleDailyJob();
  }, timeUntilSchedule);
}

// بدء الجدولة اليومية
scheduleDailyJob();

// ==============================================
// 6. نقاط النهاية (Endpoints) للتحكم في الجدولة
// ==============================================

// تشغيل الجدولة يدوياً (للاختبار)
app.post('/api/schedule/run-now', async (req, res) => {
  try {
    console.log('🔄 تشغيل الجدولة يدوياً...');
    const results = await runDailySchedule();
    res.json({
      success: true,
      message: 'تم تشغيل الجدولة بنجاح',
      results: results
    });
  } catch (err) {
    console.error('❌ خطأ في التشغيل اليدوي:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// إنشاء حصص لتاريخ محدد
app.post('/api/schedule/create-for-date', async (req, res) => {
  try {
    const { date, schoolId } = req.body;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد التاريخ (date) بصيغة YYYY-MM-DD'
      });
    }
    
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'التاريخ غير صالح'
      });
    }
    
    targetDate.setHours(0, 0, 0, 0);
    
    let results;
    if (schoolId) {
      results = await createLiveClassesForDate(targetDate, schoolId);
    } else {
      results = await createLiveClassesForAllSchools(targetDate);
    }
    
    res.json({
      success: true,
      message: `تم إنشاء الحصص لتاريخ ${date}`,
      results: results
    });
    
  } catch (err) {
    console.error('❌ خطأ في إنشاء حصص لتاريخ محدد:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// الحصول على حالة الجدولة
app.get('/api/schedule/status', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // عدد الحصص المجدولة اليوم
    const todayCount = await LiveClass.countDocuments({
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    // عدد الحصص المجدولة غداً
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    const tomorrowCount = await LiveClass.countDocuments({
      date: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      }
    });
    
    // عدد الحصص الإجمالي
    const totalCount = await LiveClass.countDocuments();
    
    // التوزيع حسب الحالة
    const statusStats = await LiveClass.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statusMap = {};
    statusStats.forEach(stat => {
      statusMap[stat._id] = stat.count;
    });
    
    res.json({
      success: true,
      stats: {
        today: todayCount,
        tomorrow: tomorrowCount,
        total: totalCount,
        byStatus: statusMap
      },
      nextSchedule: '5:00 صباحاً يومياً'
    });
    
  } catch (err) {
    console.error('❌ خطأ في جلب حالة الجدولة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 7. نقطة نهاية لإعادة جدولة جميع الحصص (إعادة إنشاء)
// ==============================================
app.post('/api/schedule/recreate-all', async (req, res) => {
  try {
    const { startDate, endDate, schoolId } = req.body;
    
    console.log('🔄 إعادة جدولة جميع الحصص...');
    
    // تحديد نطاق التواريخ
    let start, end;
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      // افتراضي: الأسبوع القادم (7 أيام)
      start = new Date();
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(end.getDate() + 7);
    }
    
    console.log(`📅 النطاق: ${start.toISOString().split('T')[0]} - ${end.toISOString().split('T')[0]}`);
    
    // حذف الحصص الحية في النطاق (اختياري)
    // await LiveClass.deleteMany({
    //   date: { $gte: start, $lte: end }
    // });
    // console.log('🗑️ تم حذف الحصص القديمة');
    
    const allResults = {
      totalDays: 0,
      totalCreated: 0,
      totalSkipped: 0,
      totalFailed: 0,
      days: []
    };
    
    // إنشاء حصص لكل يوم في النطاق
    let currentDate = new Date(start);
    while (currentDate <= end) {
      console.log(`\n📅 معالجة يوم: ${currentDate.toISOString().split('T')[0]}`);
      
      let results;
      if (schoolId) {
        results = await createLiveClassesForDate(currentDate, schoolId);
      } else {
        results = await createLiveClassesForAllSchools(currentDate);
      }
      
      allResults.totalDays++;
      allResults.totalCreated += results.totalCreated || 0;
      allResults.totalSkipped += results.totalSkipped || 0;
      allResults.totalFailed += results.totalFailed || 0;
      
      allResults.days.push({
        date: currentDate.toISOString().split('T')[0],
        created: results.totalCreated || 0,
        skipped: results.totalSkipped || 0,
        failed: results.totalFailed || 0
      });
      
      // الانتقال إلى اليوم التالي
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    res.json({
      success: true,
      message: `تم إعادة جدولة ${allResults.totalDays} يوم`,
      results: allResults
    });
    
  } catch (err) {
    console.error('❌ خطأ في إعادة الجدولة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

console.log('📅 تم تحميل نظام الجدولة التلقائية للحصص الحية');
    // Enroll Student in Class
    // Enroll Student in Class
  // في server.js، تحديث نقطة النهاية /api/classes/:classId/enroll/:studentId
  // في نقطة /api/classes/:classId/enroll/:studentId
// TEST ENROLLMENT - Without Authentication (FOR TESTING ONLY)
app.post('/api/classes/:classId/enroll/test/:studentId', async (req, res) => {
  try {
    console.log(`=== TEST ENROLLMENT REQUEST ===`);
    console.log(`Class ID: ${req.params.classId}`);
    console.log(`Student ID: ${req.params.studentId}`);
    
    const classObj = await Class.findById(req.params.classId);
    const student = await Student.findById(req.params.studentId);

    if (!classObj || !student) {
      return res.status(404).json({ 
        success: false,
        error: 'الحصة أو الطالب غير موجود' 
      });
    }

    // Check if already enrolled
    if (classObj.students.includes(req.params.studentId)) {
      return res.status(400).json({ 
        success: false,
        error: 'الطالب مسجل بالفعل' 
      });
    }

    // Enroll
    classObj.students.push(req.params.studentId);
    await classObj.save();

    if (!student.classes.includes(req.params.classId)) {
      student.classes.push(req.params.classId);
      await student.save();
    }

    const updatedClass = await Class.findById(req.params.classId)
      .populate('teacher')
      .populate('students');

    res.json({
      success: true,
      message: 'تم إضافة الطالب بنجاح (اختبار)',
      data: updatedClass
    });

  } catch (err) {
    console.error('Test enrollment error:', err);
    res.status(500).json({ error: err.message });
  }
});
  async function createAutoPaymentSystem(studentId, classObj, enrollmentDate, recordedById) {
    try {
      console.log(`[نظام تلقائي] إنشاء دفعات للطالب ${studentId} في حصة ${classObj.name}`);
      
      const notes = `تسجيل تلقائي في حصة ${classObj.name}`;
      
      if (classObj.paymentSystem === 'monthly') {
        return await createMonthlyPaymentSystem(
          studentId,
          classObj._id,
          classObj.price,
          enrollmentDate,
          recordedById,
          notes
        );
      } 
      else if (classObj.paymentSystem === 'rounds') {
        const roundSettings = classObj.roundSettings || {
          sessionCount: 8,
          sessionDuration: 2,
          breakBetweenSessions: 0
        };
        
        return await createRoundPaymentSystem(
          studentId,
          classObj._id,
          classObj.price,
          roundSettings,
          enrollmentDate,
          recordedById,
          notes
        );
      }
      else {
        // النظام الافتراضي: شهري
        return await createMonthlyPaymentSystem(
          studentId,
          classObj._id,
          classObj.price,
          enrollmentDate,
          recordedById,
          notes
        );
      }
    } catch (err) {
      console.error('❌ خطأ في النظام التلقائي:', err);
      return {
        success: false,
        error: err.message
      };
    }
  }
    // Unenroll Student from Class
    app.delete('/api/classes/:classId/unenroll/:studentId',  async (req, res) => {
      try {
        // Remove student from class
        await Class.findByIdAndUpdate(
          req.params.classId,
          { $pull: { students: req.params.studentId } }
        );

        // Remove class from student
        await Student.findByIdAndUpdate(
          req.params.studentId,
          { $pull: { classes: req.params.classId } }
        );

        // Delete associated payments
        await Payment.deleteMany({
          student: req.params.studentId,
          class: req.params.classId,
          status: { $in: ['pending', 'late'] }
        });

        res.json({ message: 'تم إزالة الطالب من الحصة بنجاح' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
app.post('/api/debug/fix-student-classes/:studentId', async (req, res) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ error: 'الطالب غير موجود' });
    }
    
    // جلب جميع الحصص التي تحتوي على هذا الطالب
    const classesContainingStudent = await Class.find({ 
      students: student._id 
    });
    
    const classIds = classesContainingStudent.map(c => c._id);
    
    // تحديث الطالب بمصفوفة الحصص الصحيحة
    student.classes = classIds;
    await student.save();
    
    res.json({
      success: true,
      message: `تم تحديث الطالب بـ ${classIds.length} حصة`,
      student: {
        _id: student._id,
        name: student.name,
        classes: student.classes
      },
      classes: classesContainingStudent.map(c => ({
        _id: c._id,
        name: c.name,
        studentsCount: c.students.length
      }))
    });
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// أضف هذا المسار في server.js مع المسارات الأخرى للطلاب
// ==============================================
// جلب حصص طالب معين
// ==============================================


// ==============================================
// جلب تفاصيل حصة معينة (بديل محسن)
// ==============================================
app.get('/api/classes/:id/details', async (req, res) => {
  try {
    const classId = req.params.id;
    const schoolId = req.user?.schoolId || req.query.schoolId;
    
    console.log(`📚 جلب تفاصيل الحصة: ${classId}`);
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الحصة غير صالح'
      });
    }

    const classObj = await Class.findOne({
      _id: classId,
      ...(schoolId && { schoolId: schoolId })
    })
      .populate('teacher', 'name phone email')
      .populate({
        path: 'students',
        select: 'name studentId parentPhone parentEmail academicYear'
      })
      .populate('schedule.classroom', 'name location capacity');

    if (!classObj) {
      return res.status(404).json({
        success: false,
        error: 'الحصة غير موجودة أو لا تنتمي للمدرسة'
      });
    }

    // جلب إحصائيات المدفوعات للحصة
    const paymentStats = await Payment.aggregate([
      { $match: { class: new mongoose.Types.ObjectId(classId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);

    // جلب إحصائيات الحضور (آخر 30 يوم)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceStats = await Attendance.aggregate([
      {
        $match: {
          class: new mongoose.Types.ObjectId(classId),
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // تحويل إحصائيات المدفوعات
    const paymentSummary = {
      paid: 0,
      paidAmount: 0,
      pending: 0,
      pendingAmount: 0,
      late: 0,
      lateAmount: 0
    };

    paymentStats.forEach(stat => {
      if (stat._id === 'paid') {
        paymentSummary.paid = stat.count;
        paymentSummary.paidAmount = stat.total;
      } else if (stat._id === 'pending') {
        paymentSummary.pending = stat.count;
        paymentSummary.pendingAmount = stat.total;
      } else if (stat._id === 'late') {
        paymentSummary.late = stat.count;
        paymentSummary.lateAmount = stat.total;
      }
    });

    // تحويل إحصائيات الحضور
    const attendanceSummary = {
      present: 0,
      absent: 0,
      late: 0,
      total: 0
    };

    attendanceStats.forEach(stat => {
      if (stat._id === 'present') attendanceSummary.present = stat.count;
      else if (stat._id === 'absent') attendanceSummary.absent = stat.count;
      else if (stat._id === 'late') attendanceSummary.late = stat.count;
    });
    attendanceSummary.total = attendanceSummary.present + attendanceSummary.absent + attendanceSummary.late;

    // جلب الحصص الحية القادمة لهذه الحصة
    const upcomingLiveClasses = await LiveClass.find({
      class: classId,
      date: { $gte: new Date() },
      status: { $in: ['scheduled', 'ongoing'] }
    })
      .populate('teacher', 'name')
      .populate('classroom', 'name')
      .sort({ date: 1, startTime: 1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        class: classObj,
        students: classObj.students || [],
        paymentStats: paymentSummary,
        attendanceStats: attendanceSummary,
        upcomingClasses: upcomingLiveClasses,
        totalStudents: classObj.students?.length || 0,
        totalIncome: paymentSummary.paidAmount,
        totalPending: paymentSummary.pendingAmount + paymentSummary.lateAmount
      }
    });

  } catch (err) {
    console.error('❌ خطأ في جلب تفاصيل الحصة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
    // API للتسجيل الجماعي للطالب في عدة حصص
  // API للتسجيل الجماعي للطالب في عدة حصص
  // التسجيل الجماعي مع إنشاء أنظمة الدفع تلقائياً
// التسجيل الجماعي مع إنشاء أنظمة الدفع تلقائياً
// ==============================================
// ENROLL STUDENT IN MULTIPLE CLASSES - مع إنشاء نظام الدفع
// ==============================================

app.post('/api/students/:studentId/enroll-multiple', async (req, res) => {
  try {
    const { classIds, roundSettings } = req.body;
    const studentId = req.params.studentId;
    
    // جلب schoolId من التوكن أو من الطلب
    const schoolId = req.user?.schoolId || req.body.schoolId;
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }
    
    const student = await Student.findOne({ 
      _id: studentId,
      schoolId: schoolId 
    });
    
    if (!student) {
      return res.status(404).json({ 
        success: false,
        error: 'الطالب غير موجود أو لا ينتمي للمدرسة' 
      });
    }
    
    const results = { successful: [], failed: [] };
    const allPayments = [];
    
    for (const classId of classIds) {
      try {
        // التحقق من أن الحصة في نفس المدرسة
        const classObj = await Class.findOne({ 
          _id: classId,
          schoolId: schoolId 
        });
        
        if (!classObj) {
          results.failed.push({ 
            classId, 
            error: 'الحصة غير موجودة أو لا تنتمي للمدرسة' 
          });
          continue;
        }
        
        // التحقق من عدم التسجيل المسبق
        if (classObj.students.includes(studentId)) {
          results.failed.push({ 
            classId, 
            error: 'الطالب مسجل مسبقاً في هذه الحصة' 
          });
          continue;
        }
        
        // إضافة الطالب للحصة
        classObj.students.push(studentId);
        await classObj.save();
        
        // إضافة الحصة للطالب
        if (!student.classes.includes(classId)) {
          student.classes.push(classId);
        }
        
        // ==============================================
        // 🔥 إنشاء نظام الدفع تلقائياً
        // ==============================================
        let paymentResult = null;
        const enrollmentDate = new Date();
        const recordedById = req.user?.id || null;
        
        if (classObj.paymentSystem === 'monthly') {
          // نظام شهري: 12 دفعة
          paymentResult = await createMonthlyPaymentSystem(
            studentId,
            classId,
            classObj.price || 0,
            enrollmentDate,
            recordedById,
            `تسجيل تلقائي في حصة ${classObj.name}`
          );
          console.log(`✅ تم إنشاء نظام دفع شهري للحصة: ${classObj.name}`);
          
        } else if (classObj.paymentSystem === 'rounds') {
          // نظام جولات
          const settings = classObj.roundSettings || {
            sessionCount: roundSettings?.sessionCount || 8,
            sessionDuration: 2,
            breakBetweenSessions: 0
          };
          
          paymentResult = await createRoundPaymentSystem(
            studentId,
            classId,
            classObj.price || 0,
            settings,
            enrollmentDate,
            recordedById,
            `تسجيل تلقائي في حصة ${classObj.name}`
          );
          console.log(`✅ تم إنشاء نظام جولات للحصة: ${classObj.name}`);
        }
        
        // جمع الدفعات التي تم إنشاؤها
        if (paymentResult && paymentResult.payments) {
          allPayments.push(...paymentResult.payments);
        }
        
        results.successful.push({ 
          classId, 
          className: classObj.name,
          paymentSystem: classObj.paymentSystem,
          paymentsCreated: paymentResult?.payments?.length || 0
        });
        
      } catch (err) {
        console.error(`❌ خطأ في تسجيل الحصة ${classId}:`, err);
        results.failed.push({ classId, error: err.message });
      }
    }
    
    // حفظ تحديثات الطالب
    await student.save();
    
    // جلب الدفعات التي تم إنشاؤها
    const createdPayments = await Payment.find({
      student: studentId,
      class: { $in: classIds }
    }).populate('class', 'name subject price');
    
    res.json({
      success: true,
      message: `تم تسجيل الطالب في ${results.successful.length} حصة مع إنشاء نظام الدفع`,
      results: results,
      student: {
        _id: student._id,
        name: student.name,
        classes: student.classes
      },
      payments: createdPayments,
      summary: {
        totalClasses: results.successful.length,
        totalPayments: createdPayments.length,
        totalAmount: createdPayments.reduce((sum, p) => sum + p.amount, 0)
      }
    });
    
  } catch (err) {
    console.error('❌ خطأ في التسجيل الجماعي:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});
  // الحصول على جميع أنظمة الدفع للطالب
  app.get('/api/students/:studentId/payment-systems',  async (req, res) => {
    try {
      const studentId = req.params.studentId;
      
      console.log(`جلب أنظمة الدفع للطالب: ${studentId}`);
      
      // 1. المدفوعات الشهرية
      const monthlyPayments = await Payment.find({ 
        student: studentId 
      })
      .populate('class', 'name subject price')
      .populate('recordedBy', 'username fullName')
      .sort({ monthCode: 1 });
      
      // 2. الجولات
      const roundPayments = await RoundPayment.find({ 
        student: studentId 
      })
      .populate('class', 'name subject price')
      .populate('recordedBy', 'username fullName')
      .sort({ startDate: -1 });
      
      // 3. تجميع المدفوعات الشهرية حسب الحالة
      const monthlySummary = {
        all: monthlyPayments,
        pending: monthlyPayments.filter(p => p.status === 'pending'),
        late: monthlyPayments.filter(p => p.status === 'late'),
        paid: monthlyPayments.filter(p => p.status === 'paid'),
        totalAmount: monthlyPayments.reduce((sum, p) => sum + p.amount, 0),
        totalPending: monthlyPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
        totalLate: monthlyPayments.filter(p => p.status === 'late').reduce((sum, p) => sum + p.amount, 0),
        totalPaid: monthlyPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0)
      };
      
      // 4. تجميع الجولات حسب الحالة
      const roundSummary = {
        all: roundPayments,
        pending: roundPayments.filter(r => r.status === 'pending'),
        paid: roundPayments.filter(r => r.status === 'paid'),
        cancelled: roundPayments.filter(r => r.status === 'cancelled'),
        totalAmount: roundPayments.reduce((sum, r) => sum + r.totalAmount, 0)
      };
      
      res.json({
        success: true,
        monthly: monthlySummary,
        rounds: roundSummary,
        summary: {
          totalMonthlyPayments: monthlyPayments.length,
          totalRounds: roundPayments.length,
          totalPendingAmount: monthlySummary.totalPending + roundSummary.pending.reduce((sum, r) => sum + r.totalAmount, 0),
          totalPaidAmount: monthlySummary.totalPaid + roundSummary.paid.reduce((sum, r) => sum + r.totalAmount, 0),
          totalAllAmount: monthlySummary.totalAmount + roundSummary.totalAmount
        }
      });
      
    } catch (err) {
      console.error('خطأ في جلب أنظمة الدفع:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });

  // نقطة نهاية لاختبار إنشاء نظام الدفع
  app.post('/api/test/create-payments',  async (req, res) => {
    try {
      const { studentId, classId, type } = req.body;
      
      const student = await Student.findById(studentId);
      const classObj = await Class.findById(classId);
      
      if (!student || !classObj) {
        return res.status(404).json({ error: 'الطالب أو الحصة غير موجود' });
      }
      
      let result;
      const recordedById = req.user.id;
      
      if (type === 'monthly') {
        result = await createMonthlyPaymentSystem(
          studentId,
          classId,
          classObj.price,
          new Date(),
          recordedById,
          'دفعات شهرية تجريبية'
        );
      } else if (type === 'rounds') {
        result = await createRoundPaymentSystem(
          studentId,
          classId,
          classObj.price,
          { sessionCount: 8, sessionDuration: 2 },
          new Date(),
          recordedById,
          'جولة تجريبية'
        );
      } else {
        result = await createAutoPaymentSystem(
          studentId,
          classObj,
          new Date(),
          recordedById
        );
      }
      
      res.json({
        success: true,
        message: 'تم الاختبار بنجاح',
        result: result
      });
      
    } catch (err) {
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });
    // Attendance
    app.get('/api/attendance',  async (req, res) => {
      try {
        const { class: classId, student, date } = req.query;
        const query = {};

        if (classId) query.class = classId;
        if (student) query.student = student;
        if (date) {
          const startDate = new Date(date);
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + 1);
          query.date = { $gte: startDate, $lt: endDate };
        }

        const attendance = await Attendance.find(query)
          .populate('student')
          .populate('class')
          .populate('recordedBy');
        res.json(attendance);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });


    // تقرير الغيابات الشهرية لحصة معينة
  app.get('/api/live-classes/:classId/monthly-attendance',  async (req, res) => {
    try {
      const { classId } = req.params;
      const { month, year } = req.query; // month: 1-12, year: YYYY
      
      if (!month || !year) {
        return res.status(400).json({ error: 'يجب تحديد الشهر والسنة' });
      }

      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      
      // الحصول على الحصة الأساسية
      const classObj = await Class.findById(classId).populate('students');
      if (!classObj) {
        return res.status(404).json({ error: 'الحصة غير موجودة' });
      }

      // الحصول على جميع الحصص الحية لهذا الشهر
      const liveClasses = await LiveClass.find({
        class: classId,
        month: monthStr,
        status: 'completed'
      }).populate('attendance.student');

      // إنشاء هيكل البيانات للتقرير
      const report = {
        class: {
          _id: classObj._id,
          name: classObj.name,
          subject: classObj.subject
        },
        month: monthStr,
        totalClasses: liveClasses.length,
        students: []
      };

      // تهيئة بيانات كل طالب
      classObj.students.forEach(student => {
        const studentData = {
          studentId: student.studentId,
          name: student.name,
          totalAbsent: 0,
          totalPresent: 0,
          totalLate: 0,
          attendanceByDate: {}
        };

        // تهيئة بيانات الحضور لكل تاريخ
        liveClasses.forEach(liveClass => {
          const dateStr = new Date(liveClass.date).toISOString().split('T')[0];
          studentData.attendanceByDate[dateStr] = 'absent'; // افتراضي غائب
          
          // البحث عن سجل الحضور للطالب
          const attendanceRecord = liveClass.attendance.find(
            att => att.student._id.toString() === student._id.toString()
          );
          
          if (attendanceRecord) {
            studentData.attendanceByDate[dateStr] = attendanceRecord.status;
            
            // تحديث الإحصائيات
            if (attendanceRecord.status === 'present') {
              studentData.totalPresent++;
            } else if (attendanceRecord.status === 'late') {
              studentData.totalLate++;
            } else if (attendanceRecord.status === 'absent') {
              studentData.totalAbsent++;
            }
          } else {
            studentData.totalAbsent++;
          }
        });

        report.students.push(studentData);
      });

      // إضافة تواريخ الحصص
      report.classDates = liveClasses.map(lc => 
        new Date(lc.date).toISOString().split('T')[0]
      ).sort();

      res.json(report);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

    app.post('/api/attendance',  async (req, res) => {
      try {
        const attendance = new Attendance({
          ...req.body,
          recordedBy: req.user.id
        });
        await attendance.save();
        res.status(201).json(attendance);
      } catch (err) {
        res.status(400).json({ error: err.message });
      }
    });

  // تقرير الغيابات الشهرية لطالب معين
  app.get('/api/students/:studentId/monthly-attendance', async (req, res) => {
    try {
      const { studentId } = req.params;
      const { month, year } = req.query;
      
      if (!month || !year) {
        return res.status(400).json({ error: 'يجب تحديد الشهر والسنة' });
      }

      const monthStr = `${year}-${month.toString().padStart(2, '0')}`;
      
      // التحقق من صلاحية المستخدم (الطالب يمكنه رؤية بياناته فقط)
      if (req.user.role === 'student' && req.user.studentId !== studentId) {
        return res.status(403).json({ error: 'غير مصرح بالوصول لهذه البيانات' });
      }

      // الحصول على بيانات الطالب
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: 'الطالب غير موجود' });
      }

      // الحصول على جميع الحصص الحية للطالب في هذا الشهر
      const liveClasses = await LiveClass.find({
        month: monthStr,
        status: 'completed',
        'class': { $in: student.classes }
      })
      .populate('class')
      .populate('attendance.student');

      // تجميع البيانات
      const report = {
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          academicYear: student.academicYear
        },
        month: monthStr,
        attendanceByClass: {},
        summary: {
          totalClasses: 0,
          totalPresent: 0,
          totalAbsent: 0,
          totalLate: 0,
          attendanceRate: 0
        }
      };

      // معالجة كل حصة
      liveClasses.forEach(liveClass => {
        const classId = liveClass.class._id.toString();
        
        if (!report.attendanceByClass[classId]) {
          report.attendanceByClass[classId] = {
            class: {
              _id: liveClass.class._id,
              name: liveClass.class.name,
              subject: liveClass.class.subject
            },
            attendance: []
          };
        }

        // البحث عن سجل الحضور للطالب
        const attendanceRecord = liveClass.attendance.find(
          att => att.student._id.toString() === studentId
        );

        const status = attendanceRecord ? attendanceRecord.status : 'absent';
        const dateStr = new Date(liveClass.date).toLocaleDateString('ar-EG');
        
        report.attendanceByClass[classId].attendance.push({
          date: liveClass.date,
          dateString: dateStr,
          status: status,
          liveClassId: liveClass._id
        });

        // تحديث الإحصائيات
        report.summary.totalClasses++;
        if (status === 'present') report.summary.totalPresent++;
        else if (status === 'absent') report.summary.totalAbsent++;
        else if (status === 'late') report.summary.totalLate++;
      });

      // حساب نسبة الحضور
      if (report.summary.totalClasses > 0) {
        report.summary.attendanceRate = Math.round(
          (report.summary.totalPresent / report.summary.totalClasses) * 100
        );
      }

      res.json(report);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

    // Cards
// Cards
// Cards
// ==============================================
// 📚 جلب بطاقات المدرسة المحددة فقط - FIXED ✅
// ==============================================
app.get('/api/cards', async (req, res) => {
  try {
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    if (!schoolId) {
      return res.json([]);
    }
    
    const cards = await Card.find({ schoolId: schoolId })
      .populate('student')
      .sort({ issueDate: -1 });
    
    console.log(`✅ تم جلب ${cards.length} بطاقة للمدرسة ${schoolId}`);
    res.json(cards);
    
  } catch (err) {
    console.error('❌ خطأ في جلب البطاقات:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cards', async (req, res) => {
  try {
    const { uid, student } = req.body;
    
    // جلب schoolId من التوكن أو من الطلب
    const schoolId = req.user?.schoolId || req.body.schoolId;
    
    if (!schoolId) {
      return res.status(400).json({ 
        error: 'يجب تحديد المدرسة (schoolId)' 
      });
    }

    // First check if card is authorized
    const authorizedCard = await AuthorizedCard.findOne({ 
      uid, 
      active: true,
      expirationDate: { $gte: new Date() }
    });

    if (!authorizedCard) {
      return res.status(400).json({ 
        error: 'البطاقة غير مصرحة أو منتهية الصلاحية. يرجى استخدام بطاقة مصرحة.' 
      });
    }

    // Check if card already assigned to another student
    const existingCard = await Card.findOne({ uid });
    if (existingCard) {
      return res.status(400).json({ error: 'البطاقة مسجلة بالفعل لطالب آخر' });
    }

    // Check if student exists and belongs to the same school
    const studentExists = await Student.findOne({ 
      _id: student,
      schoolId: schoolId
    });
    
    if (!studentExists) {
      return res.status(404).json({ error: 'الطالب غير موجود أو لا ينتمي للمدرسة' });
    }

    const card = new Card({
      uid,
      student,
      schoolId: schoolId, // إضافة schoolId
      issueDate: new Date()
    });

    await card.save();
    
    // Update authorized card with student assignment info
    await AuthorizedCard.findByIdAndUpdate(authorizedCard._id, {
      $set: { 
        assignedTo: student,
        assignedAt: new Date(),
        schoolId: schoolId
      }
    });

    res.status(201).json(card);
  } catch (err) {
    console.error('Error creating card:', err);
    res.status(400).json({ error: err.message });
  }
});

    app.delete('/api/cards/:id',  async (req, res) => {
      try {
        await Card.findByIdAndDelete(req.params.id);
        res.json({ message: 'تم حذف البطاقة بنجاح' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });



    // get student data and hess classes and payments by card 
    app.get('/api/cards/uid/:cardId',  async (req, res) => {
      const cardId = req.params.cardId;

      try {
        const card = await Card.findOne({ uid: cardId });
        if (!card) {
          return res.status(404).json({ error: 'البطاقة غير موجودة' });
        }

        const student = await Student.findById(card.student);
        if (!student) {
          return res.status(404).json({ error: 'الطالب غير موجود' });
        }

        const classes = await Class.find({ students: student._id });
        const payments = await Payment.find({ student: student._id });

        res.json({ student, classes, payments });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
// ==============================================
// ✅ جلب معاملات الاسترداد (refunds)
// ==============================================
app.get('/api/accounting/refunds', async (req, res) => {
  try {
    const { schoolId, startDate, endDate } = req.query;
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    const query = {
      schoolId: schoolId,
      type: 'refund'
    };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const refunds = await FinancialTransaction.find(query)
      .populate('student', 'name studentId')
      .populate('recordedBy', 'username fullName')
      .sort({ date: -1 });

    res.json({
      success: true,
      count: refunds.length,
      totalAmount: refunds.reduce((sum, r) => sum + r.amount, 0),
      refunds: refunds
    });

  } catch (err) {
    console.error('❌ خطأ في جلب معاملات الاسترداد:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
// ==============================================
// 📊 معاملات حقوق التسجيل ومدفوعات الحصص لليوم
// ==============================================
app.get('/api/accounting/daily-registration-and-payments', async (req, res) => {
  try {
    // الحصول على schoolId من التوكن أو من الاستعلام
    const schoolId = req.user?.schoolId || req.query.schoolId;
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    // بداية ونهاية اليوم
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`📊 جلب معاملات اليوم للمدرسة: ${schoolId}`);

    // 1. جلب رسوم التسجيل لليوم
    const registrationFees = await SchoolFee.find({
      schoolId: schoolId,
      paymentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .populate('student', 'name studentId')
    .populate('recordedBy', 'username fullName')
    .sort({ paymentDate: -1 });

    // 2. جلب مدفوعات الحصص لليوم
    const classPayments = await Payment.find({
      schoolId: schoolId,
      paymentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: 'paid'
    })
    .populate('student', 'name studentId')
    .populate('class', 'name subject price')
    .populate('recordedBy', 'username fullName')
    .sort({ paymentDate: -1 });

    // 3. جلب معاملات مالية أخرى لليوم (اختياري)
    const otherTransactions = await FinancialTransaction.find({
      schoolId: schoolId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      type: 'income'
    })
    .populate('recordedBy', 'username fullName')
    .populate('student', 'name studentId')
    .sort({ date: -1 });

    // حساب الإجماليات
    const registrationTotal = registrationFees.reduce((sum, f) => sum + f.amount, 0);
    const paymentsTotal = classPayments.reduce((sum, p) => sum + p.amount, 0);
    const otherTotal = otherTransactions.reduce((sum, t) => sum + t.amount, 0);
    const grandTotal = registrationTotal + paymentsTotal + otherTotal;

    // تنسيق النتيجة
    const result = {
      success: true,
      date: {
        start: startOfDay,
        end: endOfDay,
        formatted: new Date().toLocaleDateString('ar-EG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      },
      registrationFees: {
        total: registrationTotal,
        count: registrationFees.length,
        items: registrationFees.map(f => ({
          id: f._id,
          student: f.student?.name || 'غير معروف',
          studentId: f.student?.studentId || 'غير معروف',
          amount: f.amount,
          paymentDate: f.paymentDate,
          status: f.status,
          method: f.paymentMethod,
          invoiceNumber: f.invoiceNumber,
          recordedBy: f.recordedBy?.fullName || 'غير معروف'
        }))
      },
      classPayments: {
        total: paymentsTotal,
        count: classPayments.length,
        items: classPayments.map(p => ({
          id: p._id,
          student: p.student?.name || 'غير معروف',
          studentId: p.student?.studentId || 'غير معروف',
          class: p.class?.name || 'غير معروف',
          subject: p.class?.subject || 'غير معروف',
          amount: p.amount,
          month: p.month,
          paymentDate: p.paymentDate,
          status: p.status,
          method: p.paymentMethod,
          invoiceNumber: p.invoiceNumber,
          recordedBy: p.recordedBy?.fullName || 'غير معروف'
        }))
      },
      otherIncome: {
        total: otherTotal,
        count: otherTransactions.length,
        items: otherTransactions.map(t => ({
          id: t._id,
          description: t.description,
          amount: t.amount,
          category: t.category,
          date: t.date,
          recordedBy: t.recordedBy?.fullName || 'غير معروف'
        }))
      },
      grandTotal: {
        amount: grandTotal,
        totalTransactions: registrationFees.length + classPayments.length + otherTransactions.length
      }
    };

    res.json(result);

  } catch (err) {
    console.error('❌ خطأ في جلب معاملات اليوم:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
  // Payment Systems Routes
  app.get('/api/payment-systems/monthly/student/:studentId', async (req, res) => {
    try {
      const monthlySystems = await MonthlyPayment.find({ 
        student: req.params.studentId 
      })
        .populate('class')
        .populate('student')
        .sort({ startDate: -1 });
      
      res.json(monthlySystems);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // نقطة نهاية لفحص وتصحيح الجولات
  app.get('/api/payment-systems/rounds/:id/check',  async (req, res) => {
    try {
      const roundId = req.params.id;
      
      console.log(`فحص الجولة: ${roundId}`);
      
      const roundPayment = await RoundPayment.findById(roundId)
        .populate('student', 'name studentId')
        .populate('class', 'name subject price')
        .populate('recordedBy', 'username fullName');

      if (!roundPayment) {
        return res.status(404).json({ 
          success: false,
          error: 'الجولة غير موجودة' 
        });
      }

      // البحث عن الدفعات المرتبطة
      const relatedPayments = await Payment.find({
        $or: [
          { 
            student: roundPayment.student?._id || roundPayment.student,
            class: roundPayment.class?._id || roundPayment.class
          },
          {
            notes: { $regex: roundPayment.roundNumber, $options: 'i' }
          },
          {
            month: { $regex: roundPayment.roundNumber, $options: 'i' }
          }
        ]
      });

      const response = {
        success: true,
        round: roundPayment,
        student: roundPayment.student,
        class: roundPayment.class,
        relatedPayments: relatedPayments,
        paymentStatus: roundPayment.status,
        issues: []
      };

      // كشف المشاكل المحتملة
      if (!roundPayment.student) {
        response.issues.push('الجولة لا تحتوي على بيانات طالب');
      }

      if (relatedPayments.length === 0) {
        response.issues.push('لا توجد دفعات مرتبطة بهذه الجولة');
      }

      if (roundPayment.status === 'paid' && !roundPayment.paymentDate) {
        response.issues.push('الجولة مدفوعة ولكن بدون تاريخ دفع');
      }

      res.json(response);

    } catch (err) {
      console.error('Error checking round:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });


  // الحصول على جولات الطالب
  app.get('/api/payment-systems/rounds/student/:studentId',  async (req, res) => {
    try {
      const rounds = await RoundPayment.find({ 
        student: req.params.studentId 
      })
        .populate('class', 'name subject price')
        .populate('student', 'name studentId')
        .populate('recordedBy', 'username fullName')
        .sort({ startDate: -1 });
      
      // تحديث حالة الجولات بناءً على التاريخ
      const now = new Date();
      const updatedRounds = rounds.map(round => {
        const roundObj = round.toObject();
        const endDate = new Date(round.endDate);
        const startDate = new Date(round.startDate);
        
        if (round.status === 'paid') {
          roundObj.statusText = 'ممتازة';
          roundObj.statusClass = 'badge bg-success';
        } else if (now > endDate && round.status !== 'paid') {
          roundObj.statusText = 'منتهية';
          roundObj.statusClass = 'badge bg-danger';
        } else if (now >= startDate && now <= endDate && round.status !== 'paid') {
          roundObj.statusText = 'متأخرة';
          roundObj.statusClass = 'badge bg-warning';
        } else if (now < startDate) {
          roundObj.statusText = 'قادمة';
          roundObj.statusClass = 'badge bg-info';
        }
        
        return roundObj;
      });
      
      res.json({
        success: true,
        rounds: updatedRounds,
        summary: {
          total: updatedRounds.length,
          pending: updatedRounds.filter(r => r.status === 'pending').length,
          paid: updatedRounds.filter(r => r.status === 'paid').length,
          totalAmount: updatedRounds.reduce((sum, r) => sum + r.totalAmount, 0)
        }
      });
    } catch (err) {
      console.error('Error loading rounds:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });


  // دفع جولة
  // FIXED ROUND PAYMENT ENDPOINT
  app.put('/api/payment-systems/rounds/:id/pay',  async (req, res) => {
    try {
      console.log(`=== دفع الجولة ${req.params.id} ===`);
      console.log('Body:', req.body);
      
      const { paymentMethod, paymentDate, notes } = req.body;
      
      // البحث عن الجولة مع البيانات المترابطة
      const roundPayment = await RoundPayment.findById(req.params.id)
        .populate('student', 'name studentId')
        .populate('class', 'name subject price')
        .populate('recordedBy', 'username fullName');

      if (!roundPayment) {
        console.log('❌ الجولة غير موجودة:', req.params.id);
        return res.status(404).json({ 
          success: false,
          error: 'الجولة غير موجودة' 
        });
      }

      console.log('✅ تم العثور على الجولة:', roundPayment.roundNumber);
      console.log('الطالب:', roundPayment.student?.name);
      console.log('المبلغ:', roundPayment.totalAmount);

      // تحديث حالة الجولة
      roundPayment.status = 'paid';
      roundPayment.paymentDate = paymentDate || new Date();
      roundPayment.paymentMethod = paymentMethod || 'cash';
      
      if (notes) {
        roundPayment.notes = notes;
      }

      // تحديث حالة الجلسات
      if (roundPayment.sessions && roundPayment.sessions.length > 0) {
        roundPayment.sessions.forEach(session => {
          session.status = 'completed';
        });
      }

      await roundPayment.save();
      console.log('✅ تم تحديث حالة الجولة');

      // البحث عن الدفعة المرتبطة وتحديثها
      const payment = await Payment.findOne({
        $or: [
          { 
            student: roundPayment.student?._id || roundPayment.student,
            class: roundPayment.class?._id || roundPayment.class,
            month: { $regex: roundPayment.roundNumber, $options: 'i' }
          },
          {
            notes: { $regex: roundPayment.roundNumber, $options: 'i' }
          }
        ]
      });

      if (payment) {
        payment.status = 'paid';
        payment.paymentDate = roundPayment.paymentDate;
        payment.paymentMethod = roundPayment.paymentMethod;
        
        if (notes) {
          payment.notes = notes;
        }
        
        await payment.save();
        console.log('✅ تم تحديث الدفعة المرتبطة:', payment._id);
      } else {
        console.log('⚠️ لم يتم العثور على دفعة مرتبطة');
        
        // إنشاء دفعة جديدة إذا لم توجد
        const newPayment = new Payment({
          student: roundPayment.student?._id || roundPayment.student,
          class: roundPayment.class?._id || roundPayment.class,
          amount: roundPayment.totalAmount,
          month: `جولة ${roundPayment.roundNumber}`,
          monthCode: new Date().toISOString().slice(0, 7),
          status: 'paid',
          paymentMethod: roundPayment.paymentMethod,
          paymentDate: roundPayment.paymentDate,
          recordedBy: req.user?.id,
          notes: `دفعة جولة ${roundPayment.roundNumber} - ${roundPayment.notes || ''}`
        });
        
        await newPayment.save();
        console.log('✅ تم إنشاء دفعة جديدة:', newPayment._id);
      }

      // تسجيل المعاملة المالية
      const transaction = new FinancialTransaction({
        type: 'income',
        amount: roundPayment.totalAmount,
        description: `دفعة جولة ${roundPayment.roundNumber} للطالب ${roundPayment.student?.name || 'غير معروف'}`,
        category: 'tuition',
        recordedBy: req.user?.id,
        reference: roundPayment._id,
        student: roundPayment.student?._id || roundPayment.student
      });

      await transaction.save();
      console.log('✅ تم تسجيل المعاملة المالية');

      // الحصول على البيانات المحدثة
      const updatedRound = await RoundPayment.findById(req.params.id)
        .populate('student', 'name studentId')
        .populate('class', 'name subject price');

      res.json({
        success: true,
        message: `تم دفع الجولة ${roundPayment.roundNumber} بنجاح بقيمة ${roundPayment.totalAmount.toLocaleString()} د.ج`,
        roundPayment: updatedRound,
        receiptNumber: `RND-${Date.now().toString().slice(-8)}`,
        details: {
          student: updatedRound.student?.name,
          roundNumber: updatedRound.roundNumber,
          amount: updatedRound.totalAmount,
          paymentDate: updatedRound.paymentDate
        }
      });

    } catch (err) {
      console.error('❌ خطأ في دفع الجولة:', err);
      console.error('Stack:', err.stack);
      
      res.status(500).json({ 
        success: false,
        error: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  });

    // في ملف الخادم (server.js أو app.js)

  // Payments - Delete a payment
// Payments - Delete a payment (نهائياً)

    // Payments
  // Payments - Update the GET endpoint to populate class data
  // Update the GET /api/payments endpoint
  // نقطة نهاية جديدة لعد المدفوعات
  app.get('/api/payments/count', async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};
        
        if (status) query.status = status;
        
        const count = await Payment.countDocuments(query);
        res.json({ count, status: 'success' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to count payments', status: 'error' });
    }
  });
  // Get multiple payments by IDs (for printing multiple receipts)
  // Get multiple payments by IDs (for printing multiple receipts)
  // إنشاء دفعة جديدة للطالب
// ==============================================
// ✅ إنشاء دفعة جديدة - مع schoolId
// ==============================================
app.post('/api/payments', async (req, res) => {
  try {
    const { student, class: classId, amount, month, paymentMethod, notes } = req.body;
    
    console.log('📝 إنشاء دفعة جديدة:', req.body);
    
    // التحقق من البيانات المطلوبة
    if (!student || !amount || !month) {
      return res.status(400).json({ 
        success: false,
        error: 'البيانات ناقصة: يجب إدخال الطالب والمبلغ والشهر' 
      });
    }
    
    // التحقق من وجود الطالب
    const studentData = await Student.findById(student);
    if (!studentData) {
      return res.status(404).json({ 
        success: false,
        error: 'الطالب غير موجود' 
      });
    }

    // ✅ الحصول على schoolId من الطالب
    const schoolId = studentData.schoolId || req.user?.schoolId;
    
    console.log(`🏫 schoolId للدفعة: ${schoolId}`);
    
    // إنشاء رقم فاتورة
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
    
    // إنشاء الدفعة مع schoolId
    const paymentData = {
        schoolId: schoolId  ,// ✅ تأكد من وجود هذا السطر

      student: student,
      class: classId || null,
      amount: amount,
      month: month,
      monthCode: moment().format('YYYY-MM'),
      status: 'pending',
      paymentMethod: paymentMethod || 'cash',
      invoiceNumber: invoiceNumber,
      recordedBy: req.user?.id || null,
      notes: notes || ''
    };

    // ✅ إضافة schoolId إذا وجد
    if (schoolId) {
      paymentData.schoolId = schoolId;
    }

    const payment = new Payment(paymentData);
    await payment.save();
    
    // تسجيل المعاملة المالية (متوقعة)
    const transactionData = {
      type: 'income',
      amount: amount,
      description: notes || `دفعة جديدة للطالب ${studentData.name} لشهر ${month}`,
      category: 'tuition',
      recordedBy: req.user?.id || null,
      reference: payment._id,
      student: student
    };

    // ✅ إضافة schoolId إلى المعاملة
    if (schoolId) {
      transactionData.schoolId = schoolId;
    }

    const transaction = new FinancialTransaction(transactionData);
    await transaction.save();
    
    // الحصول على الدفعة مع البيانات المترابطة
    const populatedPayment = await Payment.findById(payment._id)
      .populate('student', 'name studentId')
      .populate('class', 'name subject')
      .populate('recordedBy', 'username fullName');
    
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الدفعة بنجاح',
      payment: populatedPayment,
      invoiceNumber: invoiceNumber
    });
    
  } catch (err) {
    console.error('❌ خطأ في إنشاء الدفعة:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});
  // Add these endpoints near the other dashboard/statistics endpoints in your server.js file

  // ==============================================
  // DASHBOARD ENDPOINTS
  // ==============================================

  // 1. Daily Statistics - Aggregated endpoint
  // في server.js - عدّل هذه النقطة لتكون بدون مصادقة
  app.get('/api/dashboard/daily-stats', async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      console.log('Fetching dashboard stats for:', today);

      // دخل اليوم
      const dailyIncome = await Payment.aggregate([
        {
          $match: {
            status: 'paid',
            paymentDate: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      // مصروفات اليوم
      const dailyExpenses = await Expense.aggregate([
        {
          $match: {
            status: 'paid',
            date: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      // الحصص اليوم
      const todayClassesCount = await LiveClass.countDocuments({
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ['scheduled', 'ongoing'] }
      });

      // الحضور اليوم
      const todayAttendance = await LiveClass.aggregate([
        {
          $match: {
            date: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $unwind: '$attendance'
        },
        {
          $group: {
            _id: '$attendance.status',
            count: { $sum: 1 }
          }
        }
      ]);

      // تحويل الحضور إلى كائن
      const attendanceStats = {
        present: 0,
        absent: 0,
        late: 0
      };
      
      todayAttendance.forEach(stat => {
        if (attendanceStats.hasOwnProperty(stat._id)) {
          attendanceStats[stat._id] = stat.count;
        }
      });

      // الطلاب المتأخرين (دون استخدام aggregate معقد)
      const pendingPayments = await Payment.find({
        status: 'pending',
        monthCode: { $lt: today.toISOString().slice(0, 7) }
      }).distinct('student');

      res.json({
        success: true,
        dailyStats: {
          income: dailyIncome[0]?.total || 0,
          expenses: dailyExpenses[0]?.total || 0,
          profit: (dailyIncome[0]?.total || 0) - (dailyExpenses[0]?.total || 0),
          totalClasses: todayClassesCount || 0
        },
        currentStudents: attendanceStats,
        lateStudentsCount: pendingPayments.length || 0,
        timestamp: new Date(),
        debug: {
          dateRange: { start: today, end: tomorrow },
          income: dailyIncome[0]?.total || 0,
          expenses: dailyExpenses[0]?.total || 0
        }
      });
    } catch (err) {
      console.error('Error in dashboard stats:', err);
      res.status(500).json({ 
        success: false,
        error: err.message,
        dailyStats: {
          income: 0,
          expenses: 0,
          profit: 0,
          totalClasses: 0
        },
        currentStudents: {
          present: 0,
          absent: 0,
          late: 0
        },
        lateStudentsCount: 0
      });
    }
  });
  // 2. Today's Classes
  // في server.js - إضافة هذه النقطة للمساعدة في التصحيح
  app.get('/api/debug/check-payments', async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // تحقق من المدفوعات اليومية
      const todayPayments = await Payment.find({
        paymentDate: { $gte: today, $lt: tomorrow },
        status: 'paid'
      }).populate('student', 'name');

      // تحقق من المصروفات اليومية
      const todayExpenses = await Expense.find({
        date: { $gte: today, $lt: tomorrow },
        status: 'paid'
      });

      // تحقق من الحصص اليوم
      const todayClasses = await LiveClass.find({
        date: { $gte: today, $lt: tomorrow }
      });

      res.json({
        today: today.toISOString(),
        payments: {
          count: todayPayments.length,
          total: todayPayments.reduce((sum, p) => sum + p.amount, 0),
          items: todayPayments.map(p => ({
            student: p.student?.name,
            amount: p.amount,
            date: p.paymentDate
          }))
        },
        expenses: {
          count: todayExpenses.length,
          total: todayExpenses.reduce((sum, e) => sum + e.amount, 0),
          items: todayExpenses.map(e => ({
            description: e.description,
            amount: e.amount,
            date: e.date
          }))
        },
        classes: {
          count: todayClasses.length,
          items: todayClasses.map(c => ({
            id: c._id,
            time: c.startTime,
            status: c.status
          }))
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  // في server.js - عدّل هذه النقطة
// ==============================================
// ✅ GET /api/live-classes/today - Get today's live classes
// ==============================================
app.get('/api/live-classes/today', async (req, res) => {
  try {
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const liveClasses = await LiveClass.find({
      schoolId: schoolId,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['scheduled', 'ongoing'] }
    })
      .populate('class', 'name subject')
      .populate('teacher', 'name')
      .populate('classroom', 'name')
      .sort({ startTime: 1 });

    res.json({
      success: true,
      data: liveClasses,
      count: liveClasses.length,
      date: today.toISOString().split('T')[0]
    });

  } catch (err) {
    console.error('❌ Error fetching today\'s live classes:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

  // 3. Late Students (Students with pending payments)
  // في server.js - عدّل هذه النقطة
  app.get('/api/students/late-payments', async (req, res) => {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.toISOString().slice(0, 7);
      
      console.log('Fetching late payments for month before:', currentMonth);

      // طريقة أبسط: الحصول على الطلاب الذين لديهم دفعات pending
      const pendingPayments = await Payment.find({
        status: 'pending'
      }).populate('student', 'name studentId');

      // تجميع حسب الطالب
      const studentMap = new Map();
      
      pendingPayments.forEach(payment => {
        if (payment.student) {
          const studentId = payment.student._id.toString();
          
          if (!studentMap.has(studentId)) {
            studentMap.set(studentId, {
              student: payment.student,
              amountDue: 0,
              monthsLate: 0,
              payments: []
            });
          }
          
          const studentData = studentMap.get(studentId);
          studentData.amountDue += payment.amount;
          studentData.monthsLate++;
          studentData.payments.push(payment);
        }
      });

      // تحويل إلى مصفوفة
      const lateStudents = Array.from(studentMap.values()).map(data => ({
        _id: data.student._id,
        name: data.student.name,
        studentId: data.student.studentId,
        amountDue: data.amountDue,
        monthsLate: data.monthsLate,
        latestPaymentDate: data.payments[0]?.createdAt
      }));

      console.log(`Found ${lateStudents.length} students with pending payments`);

      res.json(lateStudents.slice(0, 20)); // الحد الأقصى 20 طالب
    } catch (err) {
      console.error('Error fetching late students:', err);
      res.status(500).json({ 
        error: 'Failed to fetch late students',
        message: err.message 
      });
    }
  });
  // 4. Today's Attendance Stats
  app.get('/api/attendance/today-stats',  async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const liveClasses = await LiveClass.find({
        date: { $gte: today, $lt: tomorrow }
      }).populate('attendance.student');

      const attendanceMap = new Map();
      let present = 0;
      let absent = 0;
      let late = 0;

      // Collect unique students with their latest status
      liveClasses.forEach(lc => {
        lc.attendance.forEach(att => {
          const studentId = att.student._id.toString();
          
          // Only count each student once per day (take latest status)
          if (!attendanceMap.has(studentId) || 
              new Date(att.timestamp || att.joinedAt) > attendanceMap.get(studentId).timestamp) {
            
            attendanceMap.set(studentId, {
              student: att.student,
              status: att.status,
              timestamp: new Date(att.timestamp || att.joinedAt)
            });
          }
        });
      });

      // Count statuses
      attendanceMap.forEach(record => {
        if (record.status === 'present') present++;
        else if (record.status === 'absent') absent++;
        else if (record.status === 'late') late++;
      });

      // Get list of late students
      const lateStudents = Array.from(attendanceMap.values())
        .filter(record => record.status === 'late')
        .map(record => ({
          _id: record.student._id,
          name: record.student.name,
          studentId: record.student.studentId,
          time: record.timestamp.toLocaleTimeString()
        }));

      res.json({
        present,
        absent,
        late,
        late: lateStudents,
        total: present + absent + late
      });
    } catch (err) {
      console.error('Error fetching today attendance stats:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });

  // 5. Schedule a Class (Create Live Class)
  app.post('/api/live-classes/schedule',  async (req, res) => {
    try {
      const { classId, date, startTime, endTime, teacherId, classroomId } = req.body;

      // Check if class exists
      const classObj = await Class.findById(classId)
        .populate('teacher')
        .populate('students');

      if (!classObj) {
        return res.status(404).json({ 
          success: false,
          error: 'الحصة غير موجودة' 
        });
      }

      // Check if already scheduled
      const existingLiveClass = await LiveClass.findOne({
        class: classId,
        date: new Date(date),
        startTime: startTime
      });

      if (existingLiveClass) {
        return res.status(400).json({ 
          success: false,
          error: 'الحصة مجدولة مسبقاً' 
        });
      }

      // Create attendance records for all students
      const attendance = classObj.students.map(student => ({
        student: student._id,
        status: 'absent', // Default to absent
        joinedAt: null,
        leftAt: null
      }));

      // Create live class
      const liveClass = new LiveClass({
        class: classId,
        date: new Date(date),
        startTime: startTime || '08:00',
        endTime: endTime || '10:00',
        teacher: teacherId || classObj.teacher?._id,
        classroom: classroomId,
        attendance: attendance,
        status: 'scheduled',
        createdBy: req.user.id
      });

      await liveClass.save();

      // Populate for response
      const populatedLiveClass = await LiveClass.findById(liveClass._id)
        .populate('class')
        .populate('teacher')
        .populate('classroom')
        .populate('attendance.student');

      res.json({
        success: true,
        message: 'تم جدولة الحصة بنجاح',
        liveClass: populatedLiveClass
      });
    } catch (err) {
      console.error('Error scheduling class:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });

  // 6. Today's Classes Count
  app.get('/api/live-classes/today-count',  async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const count = await LiveClass.countDocuments({
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ['scheduled', 'ongoing'] }
      });

      res.json({ 
        success: true,
        count 
      });
    } catch (err) {
      console.error('Error counting today classes:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });

  // 7. Today's Expenses
  app.get('/api/accounting/today-expenses',  async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const expenses = await Expense.aggregate([
        {
          $match: {
            date: { $gte: today, $lt: tomorrow },
            status: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      res.json({ 
        success: true,
        total: expenses[0]?.total || 0,
        count: expenses[0]?.count || 0
      });
    } catch (err) {
      console.error('Error fetching today expenses:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });

  // 8. Send Payment Reminder
  app.post('/api/students/:id/send-reminder',  async (req, res) => {
    try {
      const studentId = req.params.id;
      const { message } = req.body;

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ 
          success: false,
          error: 'الطالب غير موجود' 
        });
      }

      // Create notification message
      const notification = new Message({
        sender: req.user.id,
        recipients: [{
          student: studentId,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail
        }],
        content: message || `تنبيه: لديك دفعات متأخرة. يرجى التواصل مع الإدارة.`,
        messageType: 'individual',
        status: 'sent'
      });

      await notification.save();

      // Send SMS if phone number exists
      if (student.parentPhone) {
        try {
          const smsContent = `عزيزي ولي أمر الطالب ${student.name}: لديك دفعات متأخرة. يرجى التواصل مع إدارة المدرسة.`;
          await smsGateway.send(student.parentPhone, smsContent);
        } catch (smsErr) {
          console.error('Failed to send SMS:', smsErr);
        }
      }

      res.json({
        success: true,
        message: 'تم إرسال التذكير بنجاح'
      });
    } catch (err) {
      console.error('Error sending reminder:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });

  // 9. Record Attendance
  app.post('/api/attendance/record',  async (req, res) => {
    try {
      const { studentId, status, timestamp } = req.body;

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ 
          success: false,
          error: 'الطالب غير موجود' 
        });
      }

      // Find today's live classes for this student
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const liveClasses = await LiveClass.find({
        date: { $gte: today, $lt: tomorrow },
        'class': { $in: student.classes }
      });

      if (liveClasses.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'لا توجد حصص للطالب اليوم' 
        });
      }

      // Record attendance for each class
      const attendanceRecords = [];
      
      for (const liveClass of liveClasses) {
        const attendanceIndex = liveClass.attendance.findIndex(
          att => att.student.toString() === studentId
        );

        if (attendanceIndex !== -1) {
          liveClass.attendance[attendanceIndex].status = status || 'present';
          liveClass.attendance[attendanceIndex].joinedAt = timestamp || new Date();
          
          // If status is present, mark current time
          if (status === 'present') {
            liveClass.attendance[attendanceIndex].joinedAt = timestamp || new Date();
          }
        } else {
          // Add new attendance record
          liveClass.attendance.push({
            student: studentId,
            status: status || 'present',
            joinedAt: timestamp || new Date(),
            leftAt: null
          });
        }

        await liveClass.save();
        attendanceRecords.push(liveClass._id);
      }

      // Send notification to parent
      if (student.parentPhone) {
        try {
          const smsContent = `تم تسجيل ${status === 'present' ? 'حضور' : status === 'absent' ? 'غياب' : 'تأخير'} الطالب ${student.name} في الحصص اليومية.`;
          await smsGateway.send(student.parentPhone, smsContent);
        } catch (smsErr) {
          console.error('Failed to send SMS:', smsErr);
        }
      }

      res.json({
        success: true,
        message: `تم تسجيل ${status === 'present' ? 'الحضور' : status === 'absent' ? 'الغياب' : 'التأخير'} بنجاح`,
        student: {
          name: student.name,
          studentId: student.studentId
        },
        recordedClasses: attendanceRecords.length
      });
    } catch (err) {
      console.error('Error recording attendance:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });

  // 10. Notifications for Dashboard
  app.get('/api/notifications',  async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get recent messages
      const recentMessages = await Message.find({
        sentAt: { $gte: today }
      })
      .populate('sender', 'username fullName')
      .populate('recipients.student', 'name studentId')
      .sort({ sentAt: -1 })
      .limit(20);

      // Get pending payments count
      const pendingPaymentsCount = await Payment.countDocuments({
        status: 'pending',
        monthCode: { $lt: new Date().toISOString().slice(0, 7) }
      });

      // Get upcoming classes count
      const upcomingClassesCount = await LiveClass.countDocuments({
        date: { $gte: today },
        status: 'scheduled'
      });

      // Get late students count
      const lateStudentsCount = await Payment.aggregate([
        {
          $match: {
            status: 'pending',
            monthCode: { $lt: new Date().toISOString().slice(0, 7) }
          }
        },
        {
          $group: {
            _id: '$student'
          }
        },
        {
          $count: 'count'
        }
      ]);

      // Format notifications
      const notifications = [
        ...recentMessages.map(msg => ({
          id: msg._id,
          type: 'info',
          message: `رسالة ${msg.messageType === 'class' ? 'صفية' : 'فردية'} من ${msg.sender?.fullName}`,
          timestamp: msg.sentAt,
          data: {
            messageId: msg._id,
            sender: msg.sender?.fullName,
            type: msg.messageType
          }
        })),
        pendingPaymentsCount > 0 ? {
          id: 'pending-payments',
          type: 'warning',
          message: `لديك ${pendingPaymentsCount} دفعة معلقة`,
          timestamp: new Date(),
          data: { count: pendingPaymentsCount }
        } : null,
        upcomingClassesCount > 0 ? {
          id: 'upcoming-classes',
          type: 'info',
          message: `لديك ${upcomingClassesCount} حصة قادمة`,
          timestamp: new Date(),
          data: { count: upcomingClassesCount }
        } : null,
        lateStudentsCount.length > 0 ? {
          id: 'late-students',
          type: 'error',
          message: `هناك ${lateStudentsCount[0]?.count || 0} طالب متأخر في الدفع`,
          timestamp: new Date(),
          data: { count: lateStudentsCount[0]?.count || 0 }
        } : null
      ].filter(n => n !== null);

      res.json(notifications);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });

  // 11. Export Daily Report
  app.get('/api/accounting/export-daily-report',  async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get daily income
      const dailyIncome = await Payment.aggregate([
        {
          $match: {
            paymentDate: { $gte: today, $lt: tomorrow },
            status: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Get today's expenses
      const todayExpenses = await Expense.aggregate([
        {
          $match: {
            date: { $gte: today, $lt: tomorrow },
            status: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      // Get today's classes
      const todayClasses = await LiveClass.find({
        date: { $gte: today, $lt: tomorrow }
      })
      .populate('class')
      .populate('teacher')
      .populate('classroom');

      // Get today's attendance
      const todayAttendance = await LiveClass.aggregate([
        {
          $match: {
            date: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $unwind: '$attendance'
        },
        {
          $lookup: {
            from: 'students',
            localField: 'attendance.student',
            foreignField: '_id',
            as: 'student'
          }
        },
        {
          $unwind: '$student'
        },
        {
          $group: {
            _id: {
              status: '$attendance.status',
              studentName: '$student.name',
              studentId: '$student.studentId'
            },
            count: { $sum: 1 }
          }
        }
      ]);

      // Create Excel workbook
      const workbook = new ExcelJS.Workbook();
      
      // Summary sheet
      const summarySheet = workbook.addWorksheet('ملخص اليوم');
      
      summarySheet.columns = [
        { header: 'البند', key: 'item', width: 25 },
        { header: 'القيمة', key: 'value', width: 20 }
      ];
      
      summarySheet.addRows([
        { item: 'التاريخ', value: today.toLocaleDateString('ar-EG') },
        { item: 'إجمالي الإيرادات', value: dailyIncome[0]?.total || 0 },
        { item: 'إجمالي المصروفات', value: todayExpenses[0]?.total || 0 },
        { item: 'صافي الربح', value: (dailyIncome[0]?.total || 0) - (todayExpenses[0]?.total || 0) },
        { item: 'عدد الحصص', value: todayClasses.length }
      ]);
      
      // Attendance sheet
      const attendanceSheet = workbook.addWorksheet('الحضور والغياب');
      attendanceSheet.columns = [
        { header: 'اسم الطالب', key: 'studentName', width: 25 },
        { header: 'رقم الطالب', key: 'studentId', width: 15 },
        { header: 'الحالة', key: 'status', width: 15 },
        { header: 'الحصة', key: 'className', width: 25 }
      ];
      
      // Classes sheet
      const classesSheet = workbook.addWorksheet('الحصص اليومية');
      classesSheet.columns = [
        { header: 'اسم الحصة', key: 'className', width: 25 },
        { header: 'المادة', key: 'subject', width: 20 },
        { header: 'الأستاذ', key: 'teacher', width: 20 },
        { header: 'الوقت', key: 'time', width: 15 },
        { header: 'القاعة', key: 'classroom', width: 15 },
        { header: 'الحالة', key: 'status', width: 15 }
      ];
      
      todayClasses.forEach(cls => {
        classesSheet.addRow({
          className: cls.class?.name || 'غير محدد',
          subject: cls.class?.subject || 'غير محدد',
          teacher: cls.teacher?.name || 'غير محدد',
          time: cls.startTime,
          classroom: cls.classroom?.name || 'غير محدد',
          status: cls.status
        });
      });
      
      // Set response headers
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=daily-report-${today.toISOString().split('T')[0]}.xlsx`);
      
      // Write workbook to response
      await workbook.xlsx.write(res);
      res.end();
      
    } catch (err) {
      console.error('Error exporting daily report:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });

  // 12. Refresh Dashboard Data
  app.post('/api/dashboard/refresh',  (req, res) => {
    try {
      // This endpoint just acknowledges the refresh request
      // Actual data refresh happens through individual endpoints
      
      res.json({
        success: true,
        message: 'سيتم تحديث البيانات قريباً',
        timestamp: new Date()
      });
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });

  // 13. Student Details by Card UID
  app.get('/api/cards/uid/:uid',  async (req, res) => {
    try {
      const { uid } = req.params;
      
      const card = await Card.findOne({ uid: uid })
        .populate({
          path: 'student',
          populate: [
            {
              path: 'classes',
              populate: [
                { path: 'teacher', model: 'Teacher' },
                { path: 'schedule.classroom', model: 'Classroom' }
              ]
            }
          ]
        });

      if (!card) {
        return res.status(404).json({ 
          success: false,
          error: 'البطاقة غير مسجلة' 
        });
      }

      // Get student's pending payments
      const payments = await Payment.find({
        student: card.student._id,
        status: { $in: ['pending', 'late'] }
      })
      .populate('class')
      .sort({ month: 1 });

      res.json({
        success: true,
        student: card.student,
        classes: card.student.classes || [],
        payments: payments || [],
        card: {
          uid: card.uid,
          issueDate: card.issueDate
        }
      });
    } catch (err) {
      console.error('Error fetching card data:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });
  app.post('/api/payments/bulk', async (req, res) => {
    try {
      const { paymentIds } = req.body;
      
      if (!paymentIds || !Array.isArray(paymentIds)) {
        return res.status(400).json({ error: 'يجب تقديم مصفوفة من معرّفات الدفعات' });
      }

      const payments = await Payment.find({ _id: { $in: paymentIds } })
        .populate('student')
        .populate({
          path: 'class',
          populate: [
            { path: 'teacher', model: 'Teacher' },
            { path: 'schedule.classroom', model: 'Classroom' }
          ]
        })
        .populate('recordedBy')
        .sort({ paymentDate: -1 });

      res.json(payments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


    // Register Payment
    // Register Payment - FIXED VERSION
    // Enhanced payment registration with teacher share calculation
    // تحديث مسار تسجيل الدفع
  // Register Payment - FIXED VERSION - Update to return populated data
  // دفع دفعة موجودة
  // دفع دفعة موجودة - FIXED VERSION
// ==============================================
// نقطة نهاية تسديد دفعة معلقة (موجودة بالفعل، ولكن تأكد من وجودها)
// ==============================================
// في server.js - استبدل نقطة نهاية /api/payments/:id/pay بهذا الكود

// في server.js - استبدل نقطة نهاية /api/payments/:id/pay بهذا الكود (بدون مصادقة)


  // في server.js - تحديث endpoint المدفوعات
app.get('/api/payments', async (req, res) => {
  try {
    const { student, class: classId, month, monthCode, status, schoolId } = req.query;
    const query = {};

    // ✅ Filter by schoolId (critical!)
    if (schoolId) {
      query.schoolId = schoolId;
    }
    // Alternatively, use from authenticated user
    else if (req.user?.schoolId) {
      query.schoolId = req.user.schoolId;
    }

    if (student) query.student = student;
    if (classId) query.class = classId;
    // ✅ Support both 'month' and 'monthCode'
    if (monthCode) query.monthCode = monthCode;
    if (month) query.month = month;
    if (status) query.status = status;

    console.log('📊 Payment query:', JSON.stringify(query, null, 2));

    const payments = await Payment.find(query)
      .populate('student')
      .populate({
        path: 'class',
        populate: [
          { path: 'teacher', model: 'Teacher' },
          { path: 'schedule.classroom', model: 'Classroom' }
        ]
      })
      .populate('recordedBy')
      .sort({ month: 1 });
    
    res.json({
      success: true,
      count: payments.length,
      payments: payments
    });
  } catch (err) {
    console.error('❌ Error fetching payments:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});
    // Generate Invoice
  // Generate Invoice - Update to populate class data
app.get('/api/payments/:id', async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('student', 'name studentId parentPhone')
      .populate({
        path: 'class',
        populate: [
          { path: 'teacher', model: 'Teacher', select: 'name' },
          { path: 'schedule.classroom', model: 'Classroom', select: 'name' }
        ]
      })
      .populate('recordedBy', 'username fullName');

    if (!payment) {
      return res.status(404).json({ 
        success: false,
        error: 'الدفعة غير موجودة' 
      });
    }

    res.json({
      success: true,
      payment: payment
    });
  } catch (err) {
    console.error('Error fetching payment:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});
  // GET /api/payments/class/:classId - Get payments for a specific class

  app.patch('/api/payments/:id/amount', async (req, res) => {
    try {
      const { amount } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          error: 'المبلغ غير صالح'
        });
      }
      
      const updatedPayment = await Payment.findByIdAndUpdate(
        req.params.id,
        { amount: amount },
        { new: true }
      )
      .populate('student', 'name studentId')
      .populate('class', 'name subject');
      
      if (!updatedPayment) {
        return res.status(404).json({
          success: false,
          error: 'الدفعة غير موجودة'
        });
      }
      
      res.json({
        success: true,
        message: `تم تحديث مبلغ الدفعة إلى ${amount} د.ج`,
        payment: updatedPayment
      });
      
    } catch (err) {
      console.error('Error updating payment amount:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

// ==============================================
// LESSON DETAILS API - نقاط نهاية مفصلة للحصة
// ==============================================

// ==============================================
// 1. جلب تفاصيل الحصة مع جميع البيانات المرتبطة
// ==============================================
app.get('/api/classes/:id/details', async (req, res) => {
  try {
    const classId = req.params.id;
    const schoolId = req.user?.schoolId || req.query.schoolId;
    
    console.log(`📚 جلب تفاصيل الحصة: ${classId}`);
    
    // التحقق من صحة المعرف
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الحصة غير صالح'
      });
    }

    // جلب الحصة مع جميع البيانات المرتبطة
    const classObj = await Class.findById(classId)
      .populate('teacher', 'name phone email')
      .populate({
        path: 'students',
        populate: {
          path: 'classes',
          model: 'Class'
        }
      })
      .populate('schedule.classroom', 'name location capacity');

    if (!classObj) {
      return res.status(404).json({
        success: false,
        error: 'الحصة غير موجودة'
      });
    }

    // التحقق من أن الحصة تنتمي للمدرسة
    if (schoolId && classObj.schoolId?.toString() !== schoolId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح بالوصول لهذه الحصة'
      });
    }

    // جلب المدفوعات الخاصة بالحصة
    const payments = await Payment.find({ class: classId })
      .populate('student', 'name studentId parentPhone parentEmail academicYear')
      .populate('recordedBy', 'username fullName')
      .sort({ createdAt: -1 });

    // جلب إحصائيات المدفوعات
    const paymentStats = {
      total: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      paid: payments.filter(p => p.status === 'paid').length,
      paidAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      pending: payments.filter(p => p.status === 'pending' || p.status === 'late').length,
      pendingAmount: payments.filter(p => p.status === 'pending' || p.status === 'late').reduce((sum, p) => sum + p.amount, 0)
    };

    // جلب حالة الدفع لكل طالب
    const studentPaymentStatus = {};
    classObj.students.forEach(student => {
      const studentPayments = payments.filter(p => 
        p.student && p.student._id.toString() === student._id.toString()
      );
      
      // تحديد حالة الدفع (مدفوع بالكامل، جزئي، غير مدفوع)
      const totalPaid = studentPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
      const totalPending = studentPayments.filter(p => p.status !== 'paid').reduce((sum, p) => sum + p.amount, 0);
      
      let status = 'not-paid';
      if (totalPaid > 0 && totalPending === 0) {
        status = 'paid';
      } else if (totalPaid > 0 && totalPending > 0) {
        status = 'partial';
      } else if (totalPending > 0) {
        status = 'pending';
      }
      
      studentPaymentStatus[student._id.toString()] = status;
    });

    // جلب إحصائيات الغيابات (آخر 30 يوم)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceStats = await Attendance.aggregate([
      {
        $match: {
          class: new mongoose.Types.ObjectId(classId),
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const attendanceSummary = {
      present: 0,
      absent: 0,
      late: 0,
      total: 0
    };

    attendanceStats.forEach(stat => {
      if (stat._id === 'present') attendanceSummary.present = stat.count;
      else if (stat._id === 'absent') attendanceSummary.absent = stat.count;
      else if (stat._id === 'late') attendanceSummary.late = stat.count;
    });
    attendanceSummary.total = attendanceSummary.present + attendanceSummary.absent + attendanceSummary.late;

    res.json({
      success: true,
      data: {
        class: classObj,
        students: classObj.students || [],
        payments: payments,
        studentPaymentStatus: studentPaymentStatus,
        paymentStats: paymentStats,
        attendanceSummary: attendanceSummary,
        statistics: {
          totalStudents: classObj.students?.length || 0,
          totalPayments: payments.length,
          totalPaidAmount: paymentStats.paidAmount,
          totalPendingAmount: paymentStats.pendingAmount
        }
      }
    });

  } catch (err) {
    console.error('❌ خطأ في جلب تفاصيل الحصة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 2. جلب مدفوعات الحصة مع تصفية حسب الشهر
// ==============================================

// ==============================================
// STUDENT PLATFORM PAGE - Professional Student Dashboard
// ==============================================

// Serve the student platform HTML page
app.get('/studentsPlatform/:studentId', (req, res) => {
    const studentId = req.params.studentId;
    
    // Validate student ID format
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).send(`
            <!DOCTYPE html>
            <html>
            <head><title>خطأ - معرف غير صالح</title></head>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; direction: rtl;">
                <h1 style="color: #e94560;">❌ معرف غير صالح</h1>
                <p>معرف الطالب غير صحيح. يرجى التحقق من الرابط.</p>
                <a href="/" style="color: #e94560; text-decoration: none;">العودة إلى الصفحة الرئيسية</a>
            </body>
            </html>
        `);
    }
    
    // Serve the HTML file
    const htmlPath = path.join(__dirname, 'public', 'studentsPlatform.html');
    
    // Check if file exists
    if (fs.existsSync(htmlPath)) {
        res.sendFile(htmlPath);
    } else {
        // If the HTML file doesn't exist, generate a simple page with the student ID
        res.send(`
            <!DOCTYPE html>
            <html lang="ar" dir="rtl">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>منصة الطالب - Redox</title>
                <script>
                    // The HTML will load the student data via API
                    const STUDENT_ID = '${studentId}';
                    const API_BASE = window.location.origin;
                    
                    // Auto-redirect to the main page with the ID
                    window.location.href = '/studentsPlatform.html?id=' + STUDENT_ID;
                </script>
            </head>
            <body>
                <p>جاري التحميل...</p>
            </body>
            </html>
        `);
    }
});

// Alternative: Also support query parameter format
app.get('/studentsPlatform', (req, res) => {
    const studentId = req.query.id;
    if (studentId) {
        return res.redirect(`/studentsPlatform/${studentId}`);
    }
    
    // If no ID provided, show a selection page or error
    res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head><title>منصة الطالب</title></head>
        <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px; direction: rtl;">
            <h1 style="color: #e94560;">📚 منصة الطالب</h1>
            <p>يرجى تحديد معرف الطالب في الرابط.</p>
            <p style="color: #888; font-size: 14px;">مثال: /studentsPlatform/6a830ccd4edfef5becddacc0</p>
        </body>
        </html>
    `);
});


app.get('/api/classes/:id/payments', async (req, res) => {
  try {
    const classId = req.params.id;
    const { month, status, limit = 100 } = req.query;
    
    console.log(`📊 جلب مدفوعات الحصة: ${classId}`);
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الحصة غير صالح'
      });
    }

    // بناء الاستعلام
    const query = { class: classId };
    if (status && status !== 'all') query.status = status;
    if (month && month !== 'all') {
      query.monthCode = { $regex: `^${month}` };
    }

    const payments = await Payment.find(query)
      .populate('student', 'name studentId parentPhone parentEmail academicYear')
      .populate('recordedBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // إحصائيات المدفوعات
    const summary = {
      total: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
      paid: payments.filter(p => p.status === 'paid').length,
      paidAmount: payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
      pending: payments.filter(p => p.status === 'pending').length,
      pendingAmount: payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
      late: payments.filter(p => p.status === 'late').length,
      lateAmount: payments.filter(p => p.status === 'late').reduce((sum, p) => sum + p.amount, 0)
    };

    // تجميع المدفوعات حسب الشهر
    const months = {};
    payments.forEach(p => {
      const monthKey = p.monthCode || p.month || 'unknown';
      if (!months[monthKey]) {
        months[monthKey] = {
          month: monthKey,
          total: 0,
          paid: 0,
          pending: 0,
          count: 0
        };
      }
      months[monthKey].total += p.amount;
      months[monthKey].count++;
      if (p.status === 'paid') {
        months[monthKey].paid += p.amount;
      } else {
        months[monthKey].pending += p.amount;
      }
    });

    res.json({
      success: true,
      payments: payments,
      summary: summary,
      monthsSummary: Object.values(months)
    });

  } catch (err) {
    console.error('❌ خطأ في جلب مدفوعات الحصة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 3. جلب بيانات الغيابات للحصة
// ==============================================
app.get('/api/classes/:id/attendance', async (req, res) => {
  try {
    const classId = req.params.id;
    const { startDate, endDate } = req.query;
    
    console.log(`📊 جلب بيانات الغيابات للحصة: ${classId}`);
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الحصة غير صالح'
      });
    }

    // بناء نطاق التاريخ
    let dateRange = {};
    if (startDate && endDate) {
      dateRange = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // افتراضي: آخر 30 يوم
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      dateRange = {
        $gte: start,
        $lte: end
      };
    }

    // جلب الحصة مع الطلاب
    const classObj = await Class.findById(classId)
      .populate('students', 'name studentId academicYear')
      .populate('teacher', 'name');

    if (!classObj) {
      return res.status(404).json({
        success: false,
        error: 'الحصة غير موجودة'
      });
    }

    // جلب جميع الحصص الحية لهذه الحصة في الفترة المحددة
    const liveClasses = await LiveClass.find({
      class: classId,
      date: dateRange,
      status: { $in: ['completed', 'ongoing'] }
    })
      .populate({
        path: 'attendance.student',
        select: 'name studentId parentPhone parentEmail academicYear'
      })
      .populate('class', 'name subject')
      .populate('teacher', 'name')
      .populate('classroom', 'name')
      .sort({ date: 1, startTime: 1 });

    // تهيئة بيانات الطلاب
    const studentAttendanceMap = new Map();

    classObj.students.forEach(student => {
      studentAttendanceMap.set(student._id.toString(), {
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          academicYear: student.academicYear
        },
        totalClasses: liveClasses.length,
        present: 0,
        absent: 0,
        late: 0,
        attendanceRate: 0,
        records: []
      });
    });

    // تجميع سجلات الحضور
    liveClasses.forEach(liveClass => {
      liveClass.attendance.forEach(record => {
        const studentId = record.student._id.toString();
        if (studentAttendanceMap.has(studentId)) {
          const studentData = studentAttendanceMap.get(studentId);
          
          // تحديث الإحصائيات
          studentData[record.status]++;
          
          // إضافة السجل
          studentData.records.push({
            liveClassId: liveClass._id,
            date: liveClass.date,
            startTime: liveClass.startTime,
            endTime: liveClass.endTime,
            status: record.status,
            teacher: liveClass.teacher?.name,
            joinedAt: record.joinedAt,
            leftAt: record.leftAt
          });
        }
      });
    });

    // حساب نسب الحضور
    studentAttendanceMap.forEach((data) => {
      data.attendanceRate = liveClasses.length > 0 
        ? Math.round((data.present / liveClasses.length) * 100) 
        : 100;
    });

    // تحويل الخريطة إلى مصفوفة
    const studentsAttendance = Array.from(studentAttendanceMap.values());

    // ترتيب الطلاب حسب نسبة الحضور
    studentsAttendance.sort((a, b) => b.attendanceRate - a.attendanceRate);

    // إحصائيات عامة
    const statistics = {
      totalClasses: liveClasses.length,
      totalStudents: classObj.students.length,
      totalPresent: studentsAttendance.reduce((sum, s) => sum + s.present, 0),
      totalAbsent: studentsAttendance.reduce((sum, s) => sum + s.absent, 0),
      totalLate: studentsAttendance.reduce((sum, s) => sum + s.late, 0),
      averageAttendance: studentsAttendance.length > 0
        ? Math.round(studentsAttendance.reduce((sum, s) => sum + s.attendanceRate, 0) / studentsAttendance.length)
        : 0
    };

    // تفاصيل الحصص
    const classesDetails = liveClasses.map(lc => ({
      _id: lc._id,
      date: lc.date,
      startTime: lc.startTime,
      endTime: lc.endTime,
      teacher: lc.teacher?.name,
      status: lc.status,
      attendanceCount: lc.attendance.length,
      presentCount: lc.attendance.filter(a => a.status === 'present').length,
      absentCount: lc.attendance.filter(a => a.status === 'absent').length,
      lateCount: lc.attendance.filter(a => a.status === 'late').length
    }));

    res.json({
      success: true,
      data: {
        class: {
          _id: classObj._id,
          name: classObj.name,
          subject: classObj.subject,
          teacher: classObj.teacher?.name
        },
        period: {
          start: dateRange.$gte,
          end: dateRange.$lte,
          totalDays: liveClasses.length
        },
        statistics: statistics,
        studentsAttendance: studentsAttendance,
        classesDetails: classesDetails
      }
    });

  } catch (err) {
    console.error('❌ خطأ في جلب بيانات الغيابات:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 4. جلب الطلاب المتاحين للتسجيل في الحصة
// ==============================================
app.get('/api/classes/:id/available-students', async (req, res) => {
  try {
    const classId = req.params.id;
    const schoolId = req.user?.schoolId || req.query.schoolId;
    
    console.log(`📚 جلب الطلاب المتاحين للحصة: ${classId}`);
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الحصة غير صالح'
      });
    }

    // جلب الحصة مع الطلاب المسجلين
    const classObj = await Class.findById(classId).populate('students', '_id');
    
    if (!classObj) {
      return res.status(404).json({
        success: false,
        error: 'الحصة غير موجودة'
      });
    }

    // معرفات الطلاب المسجلين
    const enrolledStudentIds = new Set(
      classObj.students.map(s => s._id.toString())
    );

    // جلب جميع الطلاب في المدرسة
    const query = {};
    if (schoolId) query.schoolId = schoolId;
    
    const allStudents = await Student.find(query)
      .select('name studentId academicYear parentPhone parentEmail status')
      .sort({ name: 1 });

    // تصفية الطلاب غير المسجلين
    const availableStudents = allStudents.filter(student => 
      !enrolledStudentIds.has(student._id.toString()) && 
      student.status !== 'inactive'
    );

    res.json({
      success: true,
      availableStudents: availableStudents,
      totalAvailable: availableStudents.length,
      totalEnrolled: enrolledStudentIds.size
    });

  } catch (err) {
    console.error('❌ خطأ في جلب الطلاب المتاحين:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 5. تسجيل طالب في الحصة (مع إنشاء نظام الدفع)
// ==============================================
// ==============================================
// 📚 ENROLL STUDENT IN CLASS - مع إنشاء نظام الدفع
// ==============================================

// ==============================================
// 📚 ENROLL STUDENT IN CLASS - مع إنشاء نظام الدفع
// ==============================================

// POST /api/classes/:classId/enroll/:studentId - متوافق مع الواجهة الحالية
app.post('/api/classes/:classId/enroll/:studentId', async (req, res) => {
  try {
    const { classId, studentId } = req.params;
    const { month } = req.body;
    
    const schoolId = req.user?.schoolId || req.body.schoolId;
    
    console.log(`📝 تسجيل الطالب ${studentId} في الحصة ${classId}`);

    // جلب الحصة والطالب
    const classObj = await Class.findOne({ _id: classId, schoolId: schoolId });
    const student = await Student.findOne({ _id: studentId, schoolId: schoolId });

    if (!classObj || !student) {
      return res.status(404).json({
        success: false,
        error: 'الحصة أو الطالب غير موجود'
      });
    }

    // التحقق من التسجيل المسبق
    if (classObj.students.includes(studentId)) {
      // التحقق من وجود نظام دفع
      const existingPayments = await Payment.find({
        student: studentId,
        class: classId
      });
      
      if (existingPayments.length > 0) {
        return res.status(200).json({
          success: true,
          message: 'الطالب مسجل مسبقاً ونظام الدفع موجود',
          class: classObj,
          existed: true,
          _hasPaymentSystem: true
        });
      }
    }

    // إضافة الطالب للحصة
    if (!classObj.students.includes(studentId)) {
      classObj.students.push(studentId);
      await classObj.save();
    }

    // إضافة الحصة للطالب
    if (!student.classes.includes(classId)) {
      student.classes.push(classId);
      await student.save();
    }

    // ==============================================
    // 🔥 تحديث أو إنشاء عمولة الأستاذ
    // ==============================================
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const teacherId = classObj.teacher;
    let teacherCommission = null;
    
    if (teacherId) {
      const teacherSharePercentage = 70;
      const teacherShare = (classObj.price || 0) * (teacherSharePercentage / 100);

      teacherCommission = await TeacherCommission.findOne({
        schoolId: schoolId,
        teacher: teacherId,
        class: classId,
        month: targetMonth
      });

      if (teacherCommission) {
        // تحديث العمولة الموجودة
        const existingStudent = teacherCommission.students.find(
          s => s.student.toString() === studentId
        );
        
        if (!existingStudent) {
          teacherCommission.students.push({
            student: studentId,
            studentName: student.name,
            attendancesCount: 0,
            teacherShare: teacherShare,
            status: 'pending',
            isActive: true
          });
          teacherCommission.totalAmount += teacherShare;
          teacherCommission.remainingAmount += teacherShare;
          await teacherCommission.save();
        }
      } else {
        // إنشاء عمولة جديدة
        teacherCommission = new TeacherCommission({
          schoolId: schoolId,
          teacher: teacherId,
          class: classId,
          month: targetMonth,
          totalAmount: teacherShare,
          percentage: teacherSharePercentage,
          status: 'pending',
          totalPaid: 0,
          remainingAmount: teacherShare,
          recordedBy: req.user?.id || null,
          students: [{
            student: studentId,
            studentName: student.name,
            attendancesCount: 0,
            teacherShare: teacherShare,
            status: 'pending',
            isActive: true
          }]
        });
        await teacherCommission.save();
      }

      // إنشاء دفعات للطالب
      const existingPayment = await Payment.findOne({
        schoolId: schoolId,
        student: studentId,
        class: classId,
        monthCode: targetMonth
      });

      if (!existingPayment) {
        const payment = new Payment({
          schoolId: schoolId,
          student: studentId,
          class: classId,
          amount: classObj.price || 0,
          month: new Date(targetMonth).toLocaleString('ar-EG', { month: 'long', year: 'numeric' }),
          monthCode: targetMonth,
          status: 'pending',
          recordedBy: req.user?.id || null,
          commissionRecorded: true,
          commissionId: teacherCommission._id
        });
        await payment.save();

        // إنشاء دفعات للأشهر القادمة
        for (let i = 1; i < 12; i++) {
          const date = new Date(targetMonth);
          date.setMonth(date.getMonth() + i);
          const monthStr = date.toISOString().slice(0, 7);
          
          const futurePayment = new Payment({
            schoolId: schoolId,
            student: studentId,
            class: classId,
            amount: classObj.price || 0,
            month: date.toLocaleString('ar-EG', { month: 'long', year: 'numeric' }),
            monthCode: monthStr,
            status: 'pending',
            recordedBy: req.user?.id || null,
            commissionRecorded: true,
            commissionId: teacherCommission._id
          });
          await futurePayment.save();
        }
      }
    }

    // جلب البيانات المحدثة (بنفس تنسيق الواجهة الحالية)
    const updatedClass = await Class.findById(classId)
      .populate('teacher', 'name')
      .populate('students', 'name studentId');

    // إرجاع الاستجابة بنفس تنسيق الواجهة الحالية
    res.json({
      success: true,
      message: `تم تسجيل الطالب ${student.name} في الحصة ${classObj.name} بنجاح`,
      class: updatedClass,
      // إضافة معلومات إضافية (لن تؤثر على الواجهة الحالية)
      _commission: teacherCommission ? {
        id: teacherCommission._id,
        totalAmount: teacherCommission.totalAmount,
        status: teacherCommission.status
      } : null
    });

  } catch (err) {
    console.error('❌ خطأ في تسجيل الطالب:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
// ==============================================
// 📚 GET PAYMENTS FOR CLASS - مع تصفية حسب المدرسة
// ==============================================

app.get('/api/payments/class/:classId', async (req, res) => {
  try {
    const { classId } = req.params;
    const { status, month } = req.query;
    const schoolId = req.user?.schoolId || req.query.schoolId;
    
    console.log(`📊 جلب مدفوعات الحصة: ${classId}`);
    console.log(`🏫 schoolId: ${schoolId}`);
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الحصة غير صالح'
      });
    }

    // ✅ بناء الاستعلام مع تصفية حسب المدرسة
    const query = { class: classId };
    if (schoolId) {
      query.schoolId = schoolId;
    }
    if (status) query.status = status;
    if (month) query.monthCode = month;
    
    const payments = await Payment.find(query)
      .populate('student', 'name studentId parentPhone')
      .populate('class', 'name subject price')
      .populate('recordedBy', 'username fullName')
      .sort({ month: -1, createdAt: -1 });
    
    res.json({
      success: true,
      payments: payments || [],
      count: payments.length,
      totalAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0)
    });
    
  } catch (err) {
    console.error('❌ خطأ في جلب مدفوعات الحصة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
// ==============================================
// 6. إزالة طالب من الحصة
// ==============================================
app.delete('/api/classes/:classId/unenroll/:studentId', async (req, res) => {
  try {
    const classId = req.params.classId;
    const studentId = req.params.studentId;
    
    console.log(`🗑️ إزالة الطالب ${studentId} من الحصة ${classId}`);
    
    // التحقق من صحة المعرفات
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف غير صالح'
      });
    }

    // جلب الحصة
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({
        success: false,
        error: 'الحصة غير موجودة'
      });
    }

    // التحقق من وجود الطالب في الحصة
    if (!classObj.students.some(s => s.toString() === studentId)) {
      return res.status(400).json({
        success: false,
        error: 'الطالب غير مسجل في هذه الحصة'
      });
    }

    // إزالة الطالب من الحصة
    classObj.students = classObj.students.filter(s => s.toString() !== studentId);
    await classObj.save();

    // إزالة الحصة من الطالب
    await Student.findByIdAndUpdate(studentId, {
      $pull: { classes: classId }
    });

    // حذف المدفوعات المعلقة للطالب في هذه الحصة
    await Payment.deleteMany({
      student: studentId,
      class: classId,
      status: { $in: ['pending', 'late'] }
    });

    res.json({
      success: true,
      message: 'تم إزالة الطالب من الحصة بنجاح'
    });

  } catch (err) {
    console.error('❌ خطأ في إزالة الطالب:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 7. تسجيل دفعة جديدة للحصة
// ==============================================
app.post('/api/classes/:id/payments', async (req, res) => {
  try {
    const classId = req.params.id;
    const { studentId, amount, month, paymentMethod, notes } = req.body;
    
    console.log(`💰 تسجيل دفعة جديدة للحصة ${classId}`);
    
    // التحقق من البيانات المطلوبة
    if (!studentId || !amount || !month) {
      return res.status(400).json({
        success: false,
        error: 'البيانات ناقصة: studentId, amount, month مطلوبة'
      });
    }

    // التحقق من صحة المعرفات
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف غير صالح'
      });
    }

    // التحقق من وجود الحصة
    const classObj = await Class.findById(classId);
    if (!classObj) {
      return res.status(404).json({
        success: false,
        error: 'الحصة غير موجودة'
      });
    }

    // التحقق من وجود الطالب
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'الطالب غير موجود'
      });
    }

    // التحقق من أن الطالب مسجل في الحصة
    if (!classObj.students.some(s => s.toString() === studentId)) {
      return res.status(400).json({
        success: false,
        error: 'الطالب غير مسجل في هذه الحصة'
      });
    }

    // إنشاء رقم فاتورة
    const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

    // إنشاء الدفعة
    const payment = new Payment({
      student: studentId,
      class: classId,
      amount: amount,
      month: month,
      monthCode: month,
      status: 'paid',
      paymentMethod: paymentMethod || 'cash',
      paymentDate: new Date(),
      invoiceNumber: invoiceNumber,
      recordedBy: req.user?.id || null,
      notes: notes || ''
    });

    await payment.save();

    // تسجيل المعاملة المالية
    const transaction = new FinancialTransaction({
      type: 'income',
      amount: amount,
      description: `دفعة للطالب ${student.name} في حصة ${classObj.name} لشهر ${month}`,
      category: 'tuition',
      recordedBy: req.user?.id || null,
      reference: payment._id,
      student: studentId,
      date: new Date()
    });

    await transaction.save();

    // جلب الدفعة مع البيانات المترابطة
    const populatedPayment = await Payment.findById(payment._id)
      .populate('student', 'name studentId')
      .populate('recordedBy', 'username fullName');

    res.status(201).json({
      success: true,
      message: 'تم تسجيل الدفعة بنجاح',
      payment: populatedPayment,
      invoiceNumber: invoiceNumber
    });

  } catch (err) {
    console.error('❌ خطأ في تسجيل الدفعة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 8. تحديث دفعة
// ==============================================
app.put('/api/payments/:id', async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { amount, paymentMethod, status, notes } = req.body;
    
    console.log(`✏️ تحديث الدفعة: ${paymentId}`);
    
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الدفعة غير صالح'
      });
    }

    // جلب الدفعة
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'الدفعة غير موجودة'
      });
    }

    // تحديث البيانات
    if (amount) payment.amount = amount;
    if (paymentMethod) payment.paymentMethod = paymentMethod;
    if (status) payment.status = status;
    if (notes !== undefined) payment.notes = notes;
    
    // إذا تم تغيير الحالة إلى مدفوع، تحديث تاريخ الدفع
    if (status === 'paid' && payment.status !== 'paid') {
      payment.paymentDate = new Date();
    }

    await payment.save();

    // جلب الدفعة المحدثة
    const updatedPayment = await Payment.findById(paymentId)
      .populate('student', 'name studentId')
      .populate('recordedBy', 'username fullName');

    res.json({
      success: true,
      message: 'تم تحديث الدفعة بنجاح',
      payment: updatedPayment
    });

  } catch (err) {
    console.error('❌ خطأ في تحديث الدفعة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 9. تسديد دفعة (تغيير الحالة إلى مدفوع)
// ==============================================
// ==============================================
// 9. تسديد دفعة (تغيير الحالة إلى مدفوع) - مع schoolId
// ==============================================
// PUT /api/payments/:id/pay - متوافق مع الواجهة الحالية
app.put('/api/payments/:id/pay', async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { paymentMethod, paymentDate, notes } = req.body;
    
    console.log(`✅ تسديد الدفعة: ${paymentId}`); 

    // جلب الدفعة
    const payment = await Payment.findById(paymentId)
      .populate('student', 'name studentId')
      .populate('class', 'name subject price teacher');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'الدفعة غير موجودة'
      });
    }

    if (payment.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'الدفعة مسددة مسبقاً'
      });
    }

    // تحديث حالة الدفعة
    payment.status = 'paid';
    payment.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    payment.paymentMethod = paymentMethod || payment.paymentMethod || 'cash';
    payment.invoiceNumber = payment.invoiceNumber || `INV-${Date.now().toString().slice(-8)}`;
    if (notes) payment.notes = notes;
    await payment.save();

    // ==============================================
    // 🔥 تحديث عمولة الأستاذ
    // ==============================================
    let commissionUpdated = false;
    
    if (payment.commissionId) {
      const teacherCommission = await TeacherCommission.findById(payment.commissionId);
      
      if (teacherCommission) {
        const studentIndex = teacherCommission.students.findIndex(
          s => s.student.toString() === payment.student._id.toString()
        );

        if (studentIndex !== -1 && teacherCommission.students[studentIndex].status !== 'paid') {
          teacherCommission.students[studentIndex].status = 'paid';
          teacherCommission.students[studentIndex].paymentDate = payment.paymentDate;
          teacherCommission.students[studentIndex].paymentMethod = payment.paymentMethod;
          teacherCommission.students[studentIndex].receiptNumber = payment.invoiceNumber;
          
          teacherCommission.paymentHistory.push({
            student: payment.student._id,
            amount: payment.amount,
            paymentDate: payment.paymentDate,
            paymentMethod: payment.paymentMethod,
            receiptNumber: payment.invoiceNumber,
            month: payment.monthCode,
            recordedBy: req.user?.id || null
          });

          const studentShare = teacherCommission.students[studentIndex].teacherShare || 0;
          teacherCommission.totalPaid += studentShare;
          teacherCommission.remainingAmount = teacherCommission.totalAmount - teacherCommission.totalPaid;

          if (teacherCommission.remainingAmount <= 0) {
            teacherCommission.status = 'paid';
          } else if (teacherCommission.totalPaid > 0) {
            teacherCommission.status = 'partial';
          }

          await teacherCommission.save();
          commissionUpdated = true;
          console.log(`✅ تم تحديث عمولة الأستاذ للطالب ${payment.student.name}`);
        }
      }
    }

    // تسجيل المعاملة المالية
    const transaction = new FinancialTransaction({
      schoolId: payment.schoolId,
      type: 'income',
      amount: payment.amount,
      description: `دفعة من الطالب ${payment.student?.name || 'غير معروف'} - ${payment.month}`,
      category: 'tuition',
      recordedBy: req.user?.id || null,
      reference: payment._id,
      student: payment.student?._id,
      date: payment.paymentDate
    });
    await transaction.save();

    // جلب البيانات المحدثة (بنفس تنسيق الواجهة الحالية)
    const updatedPayment = await Payment.findById(paymentId)
      .populate('student', 'name studentId')
      .populate('class', 'name subject')
      .populate('recordedBy', 'username fullName');

    // إرجاع الاستجابة بنفس تنسيق الواجهة الحالية
    res.json({
      success: true,
      message: 'تم تسديد الدفعة بنجاح',
      payment: updatedPayment,
      invoiceNumber: payment.invoiceNumber,
      // إضافة معلومات إضافية (لن تؤثر على الواجهة الحالية)
      _commissionUpdated: commissionUpdated,
      _transactionId: transaction._id
    });

  } catch (err) {
    console.error('❌ خطأ في تسديد الدفعة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 10. إلغاء دفعة (جعلها معلقة)
// ==============================================
app.put('/api/payments/:id/cancel', async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { reason } = req.body;
    
    console.log(`↩️ إلغاء الدفعة: ${paymentId}`);
    
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الدفعة غير صالح'
      });
    }

    // جلب الدفعة
    const payment = await Payment.findById(paymentId)
      .populate('student', 'name studentId');

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'الدفعة غير موجودة'
      });
    }

    if (payment.status !== 'paid') {
      return res.status(400).json({
        success: false,
        error: 'لا يمكن إلغاء دفعة غير مدفوعة'
      });
    }

    // تحديث حالة الدفعة
    payment.status = 'pending';
    payment.paymentDate = null;
    payment.paymentMethod = null;
    if (reason) payment.notes = `إلغاء الدفعة: ${reason}`;

    await payment.save();

    // حذف المعاملة المالية المرتبطة
    await FinancialTransaction.deleteMany({
      reference: payment._id,
      type: 'income'
    });

    // جلب الدفعة المحدثة
    const updatedPayment = await Payment.findById(paymentId)
      .populate('student', 'name studentId')
      .populate('recordedBy', 'username fullName');

    res.json({
      success: true,
      message: 'تم إلغاء الدفعة بنجاح',
      payment: updatedPayment
    });

  } catch (err) {
    console.error('❌ خطأ في إلغاء الدفعة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 11. حذف دفعة (نهائياً)
// ==============================================
app.delete('/api/payments/:id', async (req, res) => {
  try {
    const paymentId = req.params.id;
    
    console.log(`🗑️ حذف الدفعة: ${paymentId}`);
    
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الدفعة غير صالح'
      });
    }

    // جلب الدفعة
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'الدفعة غير موجودة'
      });
    }

    // منع حذف الدفعات المدفوعة (يجب إلغاؤها أولاً)
    if (payment.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'لا يمكن حذف دفعة مدفوعة. يرجى إلغاؤها أولاً.'
      });
    }

    // حذف المعاملة المالية المرتبطة
    await FinancialTransaction.deleteMany({ reference: paymentId });

    // حذف الدفعة
    await Payment.findByIdAndDelete(paymentId);

    res.json({
      success: true,
      message: 'تم حذف الدفعة بنجاح'
    });

  } catch (err) {
    console.error('❌ خطأ في حذف الدفعة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 12. جلب إحصائيات سريعة للحصة
// ==============================================
app.get('/api/classes/:id/stats', async (req, res) => {
  try {
    const classId = req.params.id;
    
    console.log(`📊 جلب إحصائيات الحصة: ${classId}`);
    
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الحصة غير صالح'
      });
    }

    // جلب الحصة
    const classObj = await Class.findById(classId)
      .populate('students', 'name studentId')
      .populate('teacher', 'name');

    if (!classObj) {
      return res.status(404).json({
        success: false,
        error: 'الحصة غير موجودة'
      });
    }

    // عدد الطلاب
    const totalStudents = classObj.students?.length || 0;

    // المدفوعات
    const paymentStats = await Payment.aggregate([
      { $match: { class: new mongoose.Types.ObjectId(classId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      }
    ]);

    // إحصائيات الغيابات (آخر 30 يوم)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceStats = await Attendance.aggregate([
      {
        $match: {
          class: new mongoose.Types.ObjectId(classId),
          date: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // تحويل البيانات
    const paymentSummary = {
      paid: 0,
      paidAmount: 0,
      pending: 0,
      pendingAmount: 0,
      late: 0,
      lateAmount: 0
    };

    paymentStats.forEach(stat => {
      if (stat._id === 'paid') {
        paymentSummary.paid = stat.count;
        paymentSummary.paidAmount = stat.total;
      } else if (stat._id === 'pending') {
        paymentSummary.pending = stat.count;
        paymentSummary.pendingAmount = stat.total;
      } else if (stat._id === 'late') {
        paymentSummary.late = stat.count;
        paymentSummary.lateAmount = stat.total;
      }
    });

    const attendanceSummary = {
      present: 0,
      absent: 0,
      late: 0
    };

    attendanceStats.forEach(stat => {
      if (stat._id === 'present') attendanceSummary.present = stat.count;
      else if (stat._id === 'absent') attendanceSummary.absent = stat.count;
      else if (stat._id === 'late') attendanceSummary.late = stat.count;
    });

    res.json({
      success: true,
      data: {
        class: {
          _id: classObj._id,
          name: classObj.name,
          subject: classObj.subject,
          teacher: classObj.teacher?.name
        },
        students: {
          total: totalStudents,
          list: classObj.students
        },
        payments: paymentSummary,
        attendance: attendanceSummary,
        totalIncome: paymentSummary.paidAmount,
        totalPending: paymentSummary.pendingAmount + paymentSummary.lateAmount
      }
    });

  } catch (err) {
    console.error('❌ خطأ في جلب إحصائيات الحصة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
app.get('/api/teachers/:id/live-classes', async (req, res) => {
  try {
    const teacherId = req.params.id;
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    const query = { teacher: teacherId };
    if (schoolId) query.schoolId = schoolId;

    const liveClasses = await LiveClass.find(query)
      .populate('class', 'name subject')
      .populate('classroom', 'name')
      .sort({ date: -1 });
    
    res.json({
      success: true,
      data: liveClasses,
      count: liveClasses.length
    });
  } catch (err) {
    console.error('❌ خطأ في جلب الحصص الحية للأستاذ:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
app.get('/api/teachers/:id/stats', async (req, res) => {
  try {
    const teacherId = req.params.id;
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    // الحصول على حصص الأستاذ
    const classQuery = { teacher: teacherId };
    if (schoolId) classQuery.schoolId = schoolId;
    
    const classes = await Class.find(classQuery).populate('students');
    
    // حساب الإحصائيات
    const totalClasses = classes.length;
    const totalStudents = classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0);
    
    // الحصول على الحصص الحية
    const liveClassQuery = { teacher: teacherId };
    if (schoolId) liveClassQuery.schoolId = schoolId;
    
    const liveClasses = await LiveClass.find(liveClassQuery);
    const totalLiveClasses = liveClasses.length;
    
    // الحصص هذا الشهر
    const now = new Date();
    const thisMonthClasses = liveClasses.filter(lc => {
      const d = new Date(lc.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    
    res.json({
      success: true,
      stats: {
        totalClasses,
        totalStudents,
        totalLiveClasses,
        thisMonthClasses
      }
    });
  } catch (err) {
    console.error('❌ خطأ في جلب إحصائيات الأستاذ:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 13. جلب الحصص حسب المعلم
// ==============================================
app.get('/api/teachers/:id/classes', async (req, res) => {
  try {
    const teacherId = req.params.id;
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    const query = { teacher: teacherId };
    if (schoolId) query.schoolId = schoolId;

    const classes = await Class.find(query)
      .populate('students', 'name studentId')
      .populate('schedule.classroom', 'name location')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: classes,
      count: classes.length
    });
  } catch (err) {
    console.error('❌ خطأ في جلب حصص الأستاذ:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// ✅ نقطة نهاية ملخص المعاملات (للمعاملات التامة فقط)
// ==============================================

// ==============================================
// ✅ نقطة نهاية لحساب صافي الربح (مع خصم عمولة الأساتذة)
// ==============================================
app.get('/api/accounting/net-profit', async (req, res) => {
  try {
    const { schoolId, month } = req.query;

    if (!schoolId) {
      return res.status(400).json({ success: false, error: 'يجب تحديد المدرسة (schoolId)' });
    }

    if (!month) {
      return res.status(400).json({ success: false, error: 'يجب تحديد الشهر (month) بصيغة YYYY-MM' });
    }

    // تحويل الشهر إلى نطاق تاريخ
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1);
    const endDate = new Date(year, monthNum, 0);
    endDate.setHours(23, 59, 59, 999);

    // --- 1. حساب إجمالي المداخيل ---
    // مداخيل المدفوعات (التامة فقط)
    const payments = await Payment.find({
      schoolId: schoolId,
      monthCode: month,
      status: 'paid'
    }).select('amount');

    // رسوم التسجيل (التامة فقط)
    const fees = await SchoolFee.find({
      schoolId: schoolId,
      paymentDate: { $gte: startDate, $lte: endDate },
      status: 'paid'
    }).select('amount');

    // معاملات مالية دخل (التامة فقط)
    const incomeTransactions = await FinancialTransaction.find({
      schoolId: schoolId,
      date: { $gte: startDate, $lte: endDate },
      type: 'income'
    }).select('amount');

    let totalIncome = 0;
    payments.forEach(p => totalIncome += p.amount);
    fees.forEach(f => totalIncome += f.amount);
    incomeTransactions.forEach(t => totalIncome += t.amount);

    // --- 2. حساب مصاريف التشغيل (باستثناء عمولات الأساتذة) ---
    const expenses = await Expense.find({
      schoolId: schoolId,
      date: { $gte: startDate, $lte: endDate },
      status: 'paid',
      type: { $ne: 'teacher_payment' } // ✅ استبعاد عمولات الأساتذة
    }).select('amount');

    let totalExpenses = 0;
    expenses.forEach(e => totalExpenses += e.amount);

    // --- 3. حساب عمولات الأساتذة (70% من مداخيل الحصص) ---
    // العمولات التي تم إنشاؤها لهذا الشهر
    const commissions = await TeacherCommission.find({
      schoolId: schoolId,
      month: month
    }).select('totalAmount status');

    // مبلغ العمولات المستحقة (بغض النظر عن حالة الدفع)
    let totalCommissions = 0;
    commissions.forEach(c => {
      // إذا كانت العمولة مدفوعة أو معلقة أو جزئية، نخصمها
      if (c.status !== 'cancelled') {
        totalCommissions += c.totalAmount;
      }
    });

    // --- 4. حساب صافي الربح ---
    const netProfit = totalIncome - (totalExpenses + totalCommissions);

    res.json({
      success: true,
      month: month,
      summary: {
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
        totalCommissions: totalCommissions,
        netProfit: netProfit,
        profitMargin: totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : 0
      },
      details: {
        incomeBreakdown: {
          payments: payments.length,
          fees: fees.length,
          transactions: incomeTransactions.length
        },
        expensesBreakdown: {
          operating: expenses.length,
          commissions: commissions.length
        }
      }
    });

  } catch (err) {
    console.error('❌ خطأ في حساب صافي الربح:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// ✅ GET /api/accounting/transactions-summary/:schoolId
// ✅ GET /api/accounting/transactions-summary/:schoolId - النسخة النهائية
// ✅ GET /api/accounting/transactions-summary/:schoolId - النسخة النهائية
// ✅ GET /api/accounting/transactions-summary/:schoolId - النسخة النهائية
app.get('/api/accounting/transactions-summary/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { startDate, endDate } = req.query;

    // 1. التحقق من صحة schoolId
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف المدرسة غير صالح'
      });
    }

    // 2. التحقق من وجود المدرسة
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'المدرسة غير موجودة'
      });
    }

    // 3. التحقق من وجود startDate و endDate
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد تاريخ البداية والنهاية (startDate, endDate)'
      });
    }

    // 4. تعيين بداية ونهاية الفترة
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    console.log(`📊 جلب ملخص المعاملات للمدرسة: ${schoolId}`);
    console.log(`📅 النطاق: ${start} - ${end}`);

    // 5. جلب جميع المعاملات مع populate
    const [
      payments,
      fees,
      allFinancialTransactions,
      expenses,
      commissions
    ] = await Promise.all([
      // مدفوعات الطلاب (التامة فقط)
      Payment.find({
        schoolId: schoolId,
        paymentDate: { $gte: start, $lte: end },
        status: 'paid'
      })
      .populate('student', 'name studentId')
      .populate('class', 'name subject')
      .populate('recordedBy', 'username fullName')
      .sort({ paymentDate: -1 }),

      // رسوم التسجيل (التامة فقط)
      SchoolFee.find({
        schoolId: schoolId,
        paymentDate: { $gte: start, $lte: end },
        status: 'paid'
      })
      .populate('student', 'name studentId')
      .populate('recordedBy', 'username fullName')
      .sort({ paymentDate: -1 }),

      // المعاملات المالية (دخل فقط)
      FinancialTransaction.find({
        schoolId: schoolId,
        date: { $gte: start, $lte: end },
        type: 'income'
      })
      .populate('recordedBy', 'username fullName')
      .populate('student', 'name studentId')
      .sort({ date: -1 }),

      // المصروفات (التامة فقط)
      Expense.find({
        schoolId: schoolId,
        date: { $gte: start, $lte: end },
        status: 'paid'
      })
      .populate('recordedBy', 'username fullName')
      .sort({ date: -1 }),

      // عمولات الأساتذة (التامة فقط)
      TeacherCommission.find({
        schoolId: schoolId,
        paymentDate: { $gte: start, $lte: end },
        status: 'paid'
      })
      .populate('teacher', 'name')
      .populate('student', 'name')
      .populate('class', 'name')
      .populate('recordedBy', 'username fullName')
      .sort({ paymentDate: -1 })
    ]);

    // ==============================================
    // 🔥 الجزء المهم: تصفية المعاملات المالية المكررة
    // ==============================================
    
    // 6. إنشاء مجموعة لجميع المعرفات الفريدة (من Payment و SchoolFee)
    const uniqueIds = new Set();
    
    // إضافة معرفات Payments و SchoolFees إلى المجموعة
    payments.forEach(p => {
      uniqueIds.add(p._id.toString());
    });
    fees.forEach(f => {
      uniqueIds.add(f._id.toString());
    });

    // 7. تصفية المعاملات المالية - إزالة المكررة التي تشير إلى Payment أو SchoolFee
    const uniqueFinancialTransactions = allFinancialTransactions.filter(t => {
      // إذا كان للمعاملة reference (أي تشير إلى Payment أو SchoolFee)
      if (t.reference) {
        const refStr = t.reference.toString();
        // إذا كان المرجع موجود في مجموعة المعرفات الفريدة، فهذه المعاملة مكررة
        if (uniqueIds.has(refStr)) {
          console.log(`⚠️ إزالة معاملة مكررة: ${t._id} (reference: ${refStr})`);
          return false;
        }
        // إذا لم يكن المرجع موجوداً، نضيفه إلى المجموعة
        uniqueIds.add(refStr);
        return true;
      }
      // المعاملات التي ليس لها reference نضيفها
      return true;
    });

    // 8. حساب الإحصائيات
    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      netProfit: 0,
      totalTransactions: 0,
      counts: {
        payments: payments.length,
        fees: fees.length,
        financialTransactions: uniqueFinancialTransactions.length,
        expenses: expenses.length,
        commissions: commissions.length
      }
    };

    // حساب إجمالي الإيرادات (من جميع المصادر الفريدة)
    let totalIncome = 0;
    payments.forEach(p => totalIncome += (p.amount || 0));
    fees.forEach(f => totalIncome += (f.amount || 0));
    uniqueFinancialTransactions.forEach(t => totalIncome += (t.amount || 0));
    summary.totalIncome = totalIncome;

    // حساب إجمالي المصروفات
    let totalExpenses = 0;
    expenses.forEach(e => totalExpenses += (e.amount || 0));
    commissions.forEach(c => totalExpenses += (c.amount || 0));
    summary.totalExpenses = totalExpenses;

    summary.netProfit = totalIncome - totalExpenses;
    summary.totalTransactions = 
      payments.length + 
      fees.length + 
      uniqueFinancialTransactions.length + 
      expenses.length + 
      commissions.length;

    // 9. تجميع جميع المعاملات في مصفوفة واحدة
    const allTransactions = [];
    const seenIds = new Set();

    // إضافة مدفوعات الطلاب
    for (const p of payments) {
      const id = p._id.toString();
      if (!seenIds.has(id)) {
        seenIds.add(id);
        allTransactions.push({
          ...p.toObject(),
          _type: 'payment',
          typeLabel: 'دفعة طالب',
          icon: 'fa-money-bill-wave',
          transactionDate: p.paymentDate,
          description: `دفعة من الطالب ${p.student?.name || 'غير معروف'} - ${p.month || ''}`
        });
      }
    }

    // إضافة رسوم التسجيل
    for (const f of fees) {
      const id = f._id.toString();
      if (!seenIds.has(id)) {
        seenIds.add(id);
        allTransactions.push({
          ...f.toObject(),
          _type: 'registration_fee',
          typeLabel: 'رسوم تسجيل',
          icon: 'fa-file-invoice',
          transactionDate: f.paymentDate,
          description: `رسوم تسجيل الطالب ${f.student?.name || 'غير معروف'}`
        });
      }
    }

    // إضافة المعاملات المالية الفريدة فقط
    for (const t of uniqueFinancialTransactions) {
      const id = t._id.toString();
      if (!seenIds.has(id)) {
        seenIds.add(id);
        allTransactions.push({
          ...t.toObject(),
          _type: 'financial_transaction',
          typeLabel: 'معاملة مالية (دخل)',
          icon: 'fa-exchange-alt',
          transactionDate: t.date,
          description: t.description || 'معاملة مالية'
        });
      }
    }

    // إضافة المصروفات
    for (const e of expenses) {
      const id = e._id.toString();
      if (!seenIds.has(id)) {
        seenIds.add(id);
        allTransactions.push({
          ...e.toObject(),
          _type: 'expense',
          typeLabel: 'مصروف',
          icon: 'fa-receipt',
          transactionDate: e.date,
          description: e.description || 'مصروف'
        });
      }
    }

    // إضافة عمولات الأساتذة
    for (const c of commissions) {
      const id = c._id.toString();
      if (!seenIds.has(id)) {
        seenIds.add(id);
        allTransactions.push({
          ...c.toObject(),
          _type: 'commission',
          typeLabel: 'عمولة أستاذ',
          icon: 'fa-user-graduate',
          transactionDate: c.paymentDate,
          description: `عمولة الأستاذ ${c.teacher?.name || 'غير معروف'}`
        });
      }
    }

    // 10. ترتيب حسب التاريخ (الأحدث أولاً)
    allTransactions.sort((a, b) => {
      const dateA = a.transactionDate || a.paymentDate || a.date || a.createdAt;
      const dateB = b.transactionDate || b.paymentDate || b.date || b.createdAt;
      return new Date(dateB) - new Date(dateA);
    });

    // 11. إرجاع النتيجة
    res.json({
      success: true,
      school: {
        _id: school._id,
        name: school.name,
        schoolKey: school.schoolKey
      },
      period: {
        start: start,
        end: end,
        formattedStart: start.toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        formattedEnd: end.toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      },
      summary: summary,
      transactions: allTransactions,
      counts: {
        payments: payments.length,
        fees: fees.length,
        financialTransactions: uniqueFinancialTransactions.length,
        expenses: expenses.length,
        commissions: commissions.length
      },
      debug: {
        totalItems: allTransactions.length,
        uniqueIds: seenIds.size,
        duplicateTransactionsRemoved: allFinancialTransactions.length - uniqueFinancialTransactions.length,
        financialTransactionsOriginal: allFinancialTransactions.length,
        financialTransactionsUnique: uniqueFinancialTransactions.length
      }
    });

  } catch (err) {
    console.error('❌ خطأ في جلب ملخص المعاملات:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
app.get('/api/accounting/todays-transactions/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    // التحقق من صحة schoolId
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف المدرسة غير صالح'
      });
    }

    // التحقق من وجود المدرسة
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'المدرسة غير موجودة'
      });
    }

    // تعيين بداية ونهاية اليوم
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`📊 جلب معاملات اليوم للمدرسة: ${schoolId}`);
    console.log(`📅 النطاق: ${startOfDay} - ${endOfDay}`);

    // 1. جلب معاملات اليوم من FinancialTransaction
    const transactions = await FinancialTransaction.find({
      schoolId: schoolId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    })
    .populate('recordedBy', 'username fullName')
    .populate('student', 'name studentId')
    .sort({ date: -1 });

    // 2. جلب مدفوعات اليوم
    const todayPayments = await Payment.find({
      schoolId: schoolId,
      paymentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: 'paid'
    })
    .populate('student', 'name studentId')
    .populate('class', 'name subject')
    .populate('recordedBy', 'username fullName')
    .sort({ paymentDate: -1 });

    // 3. جلب رسوم التسجيل المدفوعة اليوم
    const todayFees = await SchoolFee.find({
      schoolId: schoolId,
      paymentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: 'paid'
    })
    .populate('student', 'name studentId')
    .populate('recordedBy', 'username fullName')
    .sort({ paymentDate: -1 });

    // 4. جلب المصروفات اليوم
    const todayExpenses = await Expense.find({
      schoolId: schoolId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: 'paid'
    })
    .populate('recordedBy', 'username fullName')
    .sort({ date: -1 });

    // 5. جلب عمولات اليوم
    const todayCommissions = await TeacherCommission.find({
      schoolId: schoolId,
      paymentDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: 'paid'
    })
    .populate('teacher', 'name')
    .populate('student', 'name')
    .populate('class', 'name')
    .populate('recordedBy', 'username fullName')
    .sort({ paymentDate: -1 });

    // حساب الإحصائيات
    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      totalTransactions: 0,
      paymentsCount: todayPayments.length,
      feesCount: todayFees.length,
      expensesCount: todayExpenses.length,
      commissionsCount: todayCommissions.length
    };

    // حساب إجمالي الإيرادات
    let totalIncome = 0;
    todayPayments.forEach(p => totalIncome += p.amount);
    todayFees.forEach(f => totalIncome += f.amount);
    summary.totalIncome = totalIncome;

    // حساب إجمالي المصروفات
    let totalExpenses = 0;
    todayExpenses.forEach(e => totalExpenses += e.amount);
    todayCommissions.forEach(c => totalExpenses += c.amount);
    summary.totalExpenses = totalExpenses;

    summary.totalTransactions = 
      transactions.length + 
      todayPayments.length + 
      todayFees.length + 
      todayExpenses.length + 
      todayCommissions.length;

    // تجميع جميع المعاملات في مصفوفة واحدة
    const allTransactions = [
      ...transactions.map(t => ({
        ...t.toObject(),
        _type: 'financial_transaction',
        typeLabel: 'معاملة مالية',
        icon: 'fa-exchange-alt'
      })),
      ...todayPayments.map(p => ({
        ...p.toObject(),
        _type: 'payment',
        typeLabel: 'دفعة طالب',
        icon: 'fa-money-bill-wave',
        description: `دفعة من الطالب ${p.student?.name || 'غير معروف'}`
      })),
      ...todayFees.map(f => ({
        ...f.toObject(),
        _type: 'registration_fee',
        typeLabel: 'رسوم تسجيل',
        icon: 'fa-file-invoice',
        description: `رسوم تسجيل الطالب ${f.student?.name || 'غير معروف'}`
      })),
      ...todayExpenses.map(e => ({
        ...e.toObject(),
        _type: 'expense',
        typeLabel: 'مصروف',
        icon: 'fa-receipt',
        description: e.description
      })),
      ...todayCommissions.map(c => ({
        ...c.toObject(),
        _type: 'commission',
        typeLabel: 'عمولة أستاذ',
        icon: 'fa-user-graduate',
        description: `عمولة الأستاذ ${c.teacher?.name || 'غير معروف'}`
      }))
    ];

    // ترتيب حسب التاريخ (الأحدث أولاً)
    allTransactions.sort((a, b) => {
      const dateA = a.paymentDate || a.date || a.createdAt;
      const dateB = b.paymentDate || b.date || b.createdAt;
      return new Date(dateB) - new Date(dateA);
    });

    res.json({
      success: true,
      school: {
        _id: school._id,
        name: school.name,
        schoolKey: school.schoolKey
      },
      date: {
        start: startOfDay,
        end: endOfDay,
        formatted: startOfDay.toLocaleDateString('ar-EG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      },
      summary: summary,
      transactions: allTransactions,
      counts: {
        financialTransactions: transactions.length,
        payments: todayPayments.length,
        fees: todayFees.length,
        expenses: todayExpenses.length,
        commissions: todayCommissions.length
      }
    });

  } catch (err) {
    console.error('❌ خطأ في جلب معاملات اليوم:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// ==============================================
// ✅ نقاط نهاية محسنة لنظام العمولات والمحاسبة
// ==============================================

// ==============================================
// 1. نقطة نهاية محسنة لجلب العمولات مع إحصائيات المدفوعات
// ==============================================
app.get('/api/accounting/teacher-commissions-enhanced', async (req, res) => {
  try {
    const { schoolId, month, status, teacherId } = req.query;
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    const filter = { schoolId: schoolId };
    if (month) filter.month = month;
    if (status && status !== 'all') filter.status = status;
    if (teacherId) filter.teacher = teacherId;

    // جلب العمولات مع البيانات المترابطة
    const commissions = await TeacherCommission.find(filter)
      .populate('teacher', 'name phone email salaryPercentage')
      .populate('class', 'name subject price')
      .populate('students.student', 'name studentId')
      .populate('recordedBy', 'username fullName')
      .sort({ month: -1, createdAt: -1 });

    // حساب الإحصائيات التفصيلية
    const stats = {
      total: commissions.length,
      totalAmount: 0,
      totalPaid: 0,
      totalRemaining: 0,
      byStatus: {
        pending: { count: 0, amount: 0, paid: 0, remaining: 0 },
        partial: { count: 0, amount: 0, paid: 0, remaining: 0 },
        paid: { count: 0, amount: 0, paid: 0, remaining: 0 },
        cancelled: { count: 0, amount: 0, paid: 0, remaining: 0 }
      },
      byTeacher: {},
      byMonth: {},
      totalStudents: 0,
      unpaidTeachers: []
    };

    const teacherMap = {};
    const monthMap = {};

    commissions.forEach(commission => {
      // الإحصائيات العامة
      stats.totalAmount += commission.totalAmount;
      stats.totalPaid += commission.totalPaid;
      stats.totalRemaining += commission.remainingAmount;
      stats.totalStudents += commission.students.filter(s => s.isActive !== false).length;

      // حسب الحالة
      if (stats.byStatus[commission.status]) {
        stats.byStatus[commission.status].count++;
        stats.byStatus[commission.status].amount += commission.totalAmount;
        stats.byStatus[commission.status].paid += commission.totalPaid;
        stats.byStatus[commission.status].remaining += commission.remainingAmount;
      }

      // حسب الأستاذ
      const teacherId = commission.teacher?._id?.toString() || 'unknown';
      if (!teacherMap[teacherId]) {
        teacherMap[teacherId] = {
          teacherId: teacherId,
          teacherName: commission.teacher?.name || 'غير معروف',
          teacherPercentage: commission.teacher?.salaryPercentage || 70,
          totalAmount: 0,
          totalPaid: 0,
          totalRemaining: 0,
          count: 0,
          studentsCount: 0,
          commissions: []
        };
      }
      teacherMap[teacherId].totalAmount += commission.totalAmount;
      teacherMap[teacherId].totalPaid += commission.totalPaid;
      teacherMap[teacherId].totalRemaining += commission.remainingAmount;
      teacherMap[teacherId].count++;
      teacherMap[teacherId].studentsCount += commission.students.filter(s => s.isActive !== false).length;
      teacherMap[teacherId].commissions.push(commission._id);

      // حسب الشهر
      if (commission.month) {
        if (!monthMap[commission.month]) {
          monthMap[commission.month] = {
            month: commission.month,
            totalAmount: 0,
            totalPaid: 0,
            totalRemaining: 0,
            count: 0,
            teachers: new Set()
          };
        }
        monthMap[commission.month].totalAmount += commission.totalAmount;
        monthMap[commission.month].totalPaid += commission.totalPaid;
        monthMap[commission.month].totalRemaining += commission.remainingAmount;
        monthMap[commission.month].count++;
        if (commission.teacher) {
          monthMap[commission.month].teachers.add(commission.teacher._id.toString());
        }
      }
    });

    // تحديد الأساتذة غير المدفوعين (لديهم عمولات معلقة)
    stats.unpaidTeachers = Object.values(teacherMap)
      .filter(t => t.totalRemaining > 0)
      .map(t => ({
        ...t,
        unpaidAmount: t.totalRemaining,
        paymentStatus: t.totalRemaining > 0 ? 'unpaid' : 'paid'
      }))
      .sort((a, b) => b.unpaidAmount - a.unpaidAmount);

    // تحويل monthMap إلى مصفوفة
    const monthsSummary = Object.values(monthMap).map(m => ({
      ...m,
      teachersCount: m.teachers.size,
      teachers: undefined
    })).sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      success: true,
      data: commissions,
      stats: stats,
      byTeacher: Object.values(teacherMap),
      byMonth: monthsSummary,
      summary: {
        totalAmount: stats.totalAmount,
        totalPaid: stats.totalPaid,
        totalRemaining: stats.totalRemaining,
        totalCommissions: stats.total,
        totalStudents: stats.totalStudents,
        unpaidTeachersCount: stats.unpaidTeachers.length,
        pendingAmount: stats.byStatus.pending.amount + stats.byStatus.partial.remaining
      }
    });

  } catch (err) {
    console.error('❌ خطأ في جلب العمولات المحسنة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 2. نقطة نهاية لإنشاء عمولات متعددة دفعة واحدة
// ==============================================
app.post('/api/accounting/teacher-commissions/bulk-generate', async (req, res) => {
  try {
    const { schoolId, month, commissions: commissionData, autoCreatePayments = true } = req.body;

    console.log(`📊 إنشاء عمولات متعددة للشهر ${month}`);
    console.log(`📦 عدد العمولات: ${commissionData?.length || 0}`);

    if (!schoolId || !month) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId) والشهر (month)'
      });
    }

    if (!commissionData || !Array.isArray(commissionData) || commissionData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'يجب توفير قائمة العمولات'
      });
    }

    // التحقق من وجود المدرسة
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'المدرسة غير موجودة'
      });
    }

    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      details: [],
      paymentsCreated: 0
    };

    for (const item of commissionData) {
      try {
        const { teacherId, classId, percentage, students, totalAmount } = item;

        // التحقق من البيانات المطلوبة
        if (!teacherId || !classId) {
          results.failed++;
          results.details.push({
            classId,
            teacherId,
            error: 'بيانات ناقصة: teacherId و classId مطلوبة',
            status: 'failed'
          });
          continue;
        }

        // التحقق من وجود الأستاذ
        const teacher = await Teacher.findOne({ _id: teacherId, schoolId: schoolId });
        if (!teacher) {
          results.failed++;
          results.details.push({
            classId,
            teacherId,
            error: 'الأستاذ غير موجود أو لا ينتمي للمدرسة',
            status: 'failed'
          });
          continue;
        }

        // التحقق من وجود الحصة
        const classObj = await Class.findOne({ _id: classId, schoolId: schoolId })
          .populate('students', 'name studentId');
        if (!classObj) {
          results.failed++;
          results.details.push({
            classId,
            teacherId,
            error: 'الحصة غير موجودة أو لا تنتمي للمدرسة',
            status: 'failed'
          });
          continue;
        }

        // التحقق من وجود عمولة سابقة
        const existingCommission = await TeacherCommission.findOne({
          schoolId: schoolId,
          teacher: teacherId,
          class: classId,
          month: month
        });

        // تحضير بيانات الطلاب
        let studentData = students || [];
        if (studentData.length === 0 && classObj.students) {
          // إذا لم يتم تحديد طلاب، استخدم جميع طلاب الحصة
          const teacherSharePercentage = percentage || teacher.salaryPercentage || 70;
          const pricePerStudent = totalAmount / classObj.students.length || classObj.price || 0;
          const teacherShare = pricePerStudent * (teacherSharePercentage / 100);
          
          studentData = classObj.students.map(student => ({
            studentId: student._id,
            studentName: student.name,
            attendancesCount: 0,
            teacherShare: teacherShare,
            status: 'pending',
            isActive: true
          }));
        }

        // حساب المبلغ الإجمالي
        let calculatedTotalAmount = totalAmount || 0;
        if (!totalAmount && studentData.length > 0) {
          calculatedTotalAmount = studentData.reduce((sum, s) => sum + (s.teacherShare || 0), 0);
        }

        const finalPercentage = percentage || teacher.salaryPercentage || 70;

        if (existingCommission) {
          // تحديث العمولة الموجودة
          // تحديث الطلاب
          for (const student of studentData) {
            const existingStudent = existingCommission.students.find(
              s => s.student.toString() === student.studentId.toString()
            );
            if (existingStudent) {
              existingStudent.teacherShare = student.teacherShare || 0;
              existingStudent.isActive = student.isActive !== false;
            } else {
              existingCommission.students.push({
                student: student.studentId,
                studentName: student.studentName || 'غير معروف',
                attendancesCount: student.attendancesCount || 0,
                teacherShare: student.teacherShare || 0,
                status: 'pending',
                isActive: student.isActive !== false
              });
            }
          }

          existingCommission.totalAmount = calculatedTotalAmount || existingCommission.students.reduce((sum, s) => sum + s.teacherShare, 0);
          existingCommission.percentage = finalPercentage;
          existingCommission.remainingAmount = existingCommission.totalAmount - existingCommission.totalPaid;
          existingCommission.updateStatus();
          await existingCommission.save();

          results.updated++;
          results.details.push({
            classId,
            className: classObj.name,
            teacherId,
            teacherName: teacher.name,
            commissionId: existingCommission._id,
            status: 'updated',
            studentsCount: existingCommission.students.length,
            totalAmount: existingCommission.totalAmount
          });
        } else {
          // إنشاء عمولة جديدة
          const commission = new TeacherCommission({
            schoolId: schoolId,
            teacher: teacherId,
            class: classId,
            month: month,
            totalAmount: calculatedTotalAmount,
            percentage: finalPercentage,
            status: 'pending',
            totalPaid: 0,
            remainingAmount: calculatedTotalAmount,
            recordedBy: req.user?.id || null,
            students: studentData.map(s => ({
              student: s.studentId,
              studentName: s.studentName || 'غير معروف',
              attendancesCount: s.attendancesCount || 0,
              teacherShare: s.teacherShare || 0,
              status: 'pending',
              isActive: s.isActive !== false
            }))
          });

          await commission.save();
          results.created++;
          results.details.push({
            classId,
            className: classObj.name,
            teacherId,
            teacherName: teacher.name,
            commissionId: commission._id,
            status: 'created',
            studentsCount: commission.students.length,
            totalAmount: commission.totalAmount
          });

          // إنشاء دفعات للطلاب (اختياري)
          if (autoCreatePayments) {
            for (const student of studentData) {
              const existingPayment = await Payment.findOne({
                schoolId: schoolId,
                student: student.studentId,
                class: classId,
                monthCode: month
              });

              if (!existingPayment) {
                const payment = new Payment({
                  schoolId: schoolId,
                  student: student.studentId,
                  class: classId,
                  amount: classObj.price || 0,
                  month: new Date(month).toLocaleString('ar-EG', { month: 'long', year: 'numeric' }),
                  monthCode: month,
                  status: 'pending',
                  recordedBy: req.user?.id || null,
                  commissionRecorded: true,
                  commissionId: commission._id
                });
                await payment.save();
                results.paymentsCreated++;
              }
            }
          }
        }

      } catch (err) {
        results.failed++;
        results.details.push({
          classId: item.classId,
          teacherId: item.teacherId,
          error: err.message,
          status: 'failed'
        });
        console.error(`❌ خطأ في إنشاء عمولة:`, err.message);
      }
    }

    // إرجاع النتيجة
    res.json({
      success: true,
      message: `تم إنشاء ${results.created} عمولة جديدة، تحديث ${results.updated} عمولة، فشل ${results.failed}`,
      results: results,
      month: month,
      schoolId: schoolId
    });

  } catch (err) {
    console.error('❌ خطأ في إنشاء العمولات المتعددة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 3. نقطة نهاية لجلب العمولات المتاحة للإنشاء (الحصص التي لا يوجد لها عمولة)
// ==============================================
app.get('/api/accounting/available-commissions', async (req, res) => {
  try {
    const { schoolId, month } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    if (!month) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد الشهر (month) بصيغة YYYY-MM'
      });
    }

    // جلب جميع الحصص النشطة في المدرسة
    const classes = await Class.find({ schoolId: schoolId })
      .populate('teacher', 'name salaryPercentage')
      .populate('students', 'name studentId');

    // جلب العمولات الموجودة لهذا الشهر
    const existingCommissions = await TeacherCommission.find({
      schoolId: schoolId,
      month: month
    }).select('class');

    const existingClassIds = new Set(
      existingCommissions.map(c => c.class.toString())
    );

    // تصفية الحصص التي ليس لها عمولة
    const availableClasses = classes
      .filter(c => !existingClassIds.has(c._id.toString()))
      .filter(c => c.teacher) // يجب أن يكون لها أستاذ
      .filter(c => c.students && c.students.length > 0); // يجب أن يكون لها طلاب

    // تحويل البيانات للتنسيق المطلوب
    const result = availableClasses.map(classObj => {
      const teacherSharePercentage = classObj.teacher?.salaryPercentage || 70;
      const pricePerStudent = classObj.price || 0;
      const teacherSharePerStudent = pricePerStudent * (teacherSharePercentage / 100);
      
      return {
        classId: classObj._id,
        className: classObj.name,
        subject: classObj.subject,
        teacherId: classObj.teacher._id,
        teacherName: classObj.teacher.name,
        teacherPercentage: teacherSharePercentage,
        studentsCount: classObj.students.length,
        students: classObj.students.map(s => ({
          studentId: s._id,
          studentName: s.name,
          amount: pricePerStudent,
          teacherShare: teacherSharePerStudent,
          status: 'pending'
        })),
        totalAmount: teacherSharePerStudent * classObj.students.length,
        price: pricePerStudent,
        paymentSystem: classObj.paymentSystem || 'monthly'
      };
    });

    res.json({
      success: true,
      data: result,
      totalAvailable: result.length,
      month: month,
      message: result.length > 0 
        ? `تم العثور على ${result.length} حصة متاحة للعمولة` 
        : 'لا توجد حصص متاحة للعمولة'
    });

  } catch (err) {
    console.error('❌ خطأ في جلب العمولات المتاحة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 4. نقطة نهاية لجلب تفاصيل مدفوعات الأستاذ
// ==============================================
app.get('/api/accounting/teacher-payment-details', async (req, res) => {
  try {
    const { schoolId, teacherId, month, startDate, endDate } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد الأستاذ (teacherId)'
      });
    }

    // جلب بيانات الأستاذ
    const teacher = await Teacher.findOne({ _id: teacherId, schoolId: schoolId });
    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'الأستاذ غير موجود أو لا ينتمي للمدرسة'
      });
    }

    // بناء فلتر العمولات
    const filter = { 
      schoolId: schoolId,
      teacher: teacherId
    };

    if (month) {
      filter.month = month;
    }

    // جلب العمولات
    const commissions = await TeacherCommission.find(filter)
      .populate('class', 'name subject price')
      .populate('students.student', 'name studentId')
      .populate('recordedBy', 'username fullName')
      .sort({ month: -1, createdAt: -1 });

    // حساب الإحصائيات
    const summary = {
      totalCommissions: commissions.length,
      totalAmount: 0,
      totalPaid: 0,
      totalRemaining: 0,
      pendingCount: 0,
      paidCount: 0,
      partialCount: 0,
      cancelledCount: 0,
      byMonth: {},
      totalStudents: 0
    };

    const monthMap = {};

    commissions.forEach(commission => {
      summary.totalAmount += commission.totalAmount;
      summary.totalPaid += commission.totalPaid;
      summary.totalRemaining += commission.remainingAmount;
      summary.totalStudents += commission.students.filter(s => s.isActive !== false).length;

      if (commission.status === 'pending') summary.pendingCount++;
      else if (commission.status === 'paid') summary.paidCount++;
      else if (commission.status === 'partial') summary.partialCount++;
      else if (commission.status === 'cancelled') summary.cancelledCount++;

      // حسب الشهر
      if (commission.month) {
        if (!monthMap[commission.month]) {
          monthMap[commission.month] = {
            month: commission.month,
            totalAmount: 0,
            totalPaid: 0,
            totalRemaining: 0,
            commissionCount: 0,
            studentsCount: 0
          };
        }
        monthMap[commission.month].totalAmount += commission.totalAmount;
        monthMap[commission.month].totalPaid += commission.totalPaid;
        monthMap[commission.month].totalRemaining += commission.remainingAmount;
        monthMap[commission.month].commissionCount++;
        monthMap[commission.month].studentsCount += commission.students.filter(s => s.isActive !== false).length;
      }
    });

    // حساب نسبة الربح
    const profitRate = summary.totalAmount > 0 
      ? ((summary.totalAmount - summary.totalPaid) / summary.totalAmount * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      teacher: {
        _id: teacher._id,
        name: teacher.name,
        salaryPercentage: teacher.salaryPercentage || 70,
        subjects: teacher.subjects,
        phone: teacher.phone,
        email: teacher.email
      },
      summary: {
        ...summary,
        profitRate: parseFloat(profitRate),
        unpaidAmount: summary.totalRemaining,
        paidPercentage: summary.totalAmount > 0 
          ? ((summary.totalPaid / summary.totalAmount) * 100).toFixed(2)
          : 0
      },
      byMonth: Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month)),
      commissions: commissions.map(c => ({
        _id: c._id,
        month: c.month,
        class: c.class,
        totalAmount: c.totalAmount,
        totalPaid: c.totalPaid,
        remainingAmount: c.remainingAmount,
        status: c.status,
        percentage: c.percentage,
        studentsCount: c.students.filter(s => s.isActive !== false).length,
        students: c.students
      })),
      totalRecords: commissions.length
    });

  } catch (err) {
    console.error('❌ خطأ في جلب تفاصيل مدفوعات الأستاذ:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 5. نقطة نهاية لدashboard - مستحقات الأساتذة
// ==============================================
app.get('/api/accounting/teacher-dues-summary', async (req, res) => {
  try {
    const { schoolId, month } = req.query;

    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    // بناء الفلتر
    const filter = { schoolId: schoolId };
    if (month) filter.month = month;

    // جلب جميع العمولات
    const commissions = await TeacherCommission.find(filter)
      .populate('teacher', 'name phone email salaryPercentage')
      .populate('class', 'name subject price')
      .sort({ month: -1 });

    // تجميع البيانات حسب الأستاذ
    const teacherMap = {};

    commissions.forEach(commission => {
      const teacherId = commission.teacher?._id?.toString() || 'unknown';
      if (!teacherMap[teacherId]) {
        teacherMap[teacherId] = {
          teacherId: teacherId,
          teacherName: commission.teacher?.name || 'غير معروف',
          teacherPercentage: commission.teacher?.salaryPercentage || 70,
          totalAmount: 0,
          totalPaid: 0,
          totalRemaining: 0,
          pendingAmount: 0,
          partialAmount: 0,
          paidAmount: 0,
          commissionCount: 0,
          paidCount: 0,
          pendingCount: 0,
          partialCount: 0,
          cancelledCount: 0,
          studentsCount: 0,
          months: new Set(),
          classes: new Set()
        };
      }

      const teacherData = teacherMap[teacherId];
      teacherData.totalAmount += commission.totalAmount;
      teacherData.totalPaid += commission.totalPaid;
      teacherData.totalRemaining += commission.remainingAmount;
      teacherData.commissionCount++;
      teacherData.studentsCount += commission.students.filter(s => s.isActive !== false).length;

      if (commission.status === 'paid') {
        teacherData.paidCount++;
        teacherData.paidAmount += commission.totalAmount;
      } else if (commission.status === 'pending') {
        teacherData.pendingCount++;
        teacherData.pendingAmount += commission.totalAmount;
      } else if (commission.status === 'partial') {
        teacherData.partialCount++;
        teacherData.partialAmount += commission.totalAmount;
      } else if (commission.status === 'cancelled') {
        teacherData.cancelledCount++;
      }

      if (commission.month) teacherData.months.add(commission.month);
      if (commission.class) teacherData.classes.add(commission.class._id.toString());
    });

    // تحويل إلى مصفوفة
    const teachersSummary = Object.values(teacherMap).map(t => ({
      ...t,
      monthsCount: t.months.size,
      classesCount: t.classes.size,
      months: undefined,
      classes: undefined,
      paidPercentage: t.totalAmount > 0 ? ((t.totalPaid / t.totalAmount) * 100).toFixed(2) : 0,
      remainingPercentage: t.totalAmount > 0 ? ((t.totalRemaining / t.totalAmount) * 100).toFixed(2) : 0,
      status: t.totalRemaining > 0 ? (t.totalPaid > 0 ? 'partial' : 'unpaid') : 'paid'
    }));

    // حساب الإجماليات
    const totals = {
      totalAmount: teachersSummary.reduce((sum, t) => sum + t.totalAmount, 0),
      totalPaid: teachersSummary.reduce((sum, t) => sum + t.totalPaid, 0),
      totalRemaining: teachersSummary.reduce((sum, t) => sum + t.totalRemaining, 0),
      totalTeachers: teachersSummary.length,
      unpaidTeachers: teachersSummary.filter(t => t.totalRemaining > 0).length,
      paidTeachers: teachersSummary.filter(t => t.totalRemaining === 0 && t.totalPaid > 0).length,
      pendingTeachers: teachersSummary.filter(t => t.totalRemaining > 0 && t.totalPaid === 0).length,
      partialTeachers: teachersSummary.filter(t => t.totalRemaining > 0 && t.totalPaid > 0).length
    };

    // ترتيب حسب المتبقي (الأكثر أولاً)
    teachersSummary.sort((a, b) => b.totalRemaining - a.totalRemaining);

    res.json({
      success: true,
      summary: totals,
      teachers: teachersSummary,
      month: month || 'جميع الأشهر',
      schoolId: schoolId
    });

  } catch (err) {
    console.error('❌ خطأ في جلب ملخص مستحقات الأساتذة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 6. نقطة نهاية للتحقق من وجود عمولات لشهر معين
// ==============================================
app.get('/api/accounting/check-commissions-exist', async (req, res) => {
  try {
    const { schoolId, month } = req.query;

    if (!schoolId || !month) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد schoolId و month'
      });
    }

    const count = await TeacherCommission.countDocuments({
      schoolId: schoolId,
      month: month
    });

    res.json({
      success: true,
      exists: count > 0,
      count: count,
      month: month
    });

  } catch (err) {
    console.error('❌ خطأ في التحقق من وجود عمولات:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 7. نقطة نهاية لحساب مستحقات الأساتذة التلقائية
// ==============================================
app.post('/api/accounting/auto-calculate-teacher-dues', async (req, res) => {
  try {
    const { schoolId, month } = req.body;

    if (!schoolId || !month) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد schoolId و month'
      });
    }

    // جلب جميع الحصص مع الأساتذة
    const classes = await Class.find({ schoolId: schoolId })
      .populate('teacher', 'name salaryPercentage')
      .populate('students', 'name studentId');

    // جلب العمولات الموجودة
    const existingCommissions = await TeacherCommission.find({
      schoolId: schoolId,
      month: month
    }).select('class');

    const existingClassIds = new Set(
      existingCommissions.map(c => c.class.toString())
    );

    // تحديد الحصص التي تحتاج عمولة
    const classesNeedingCommission = classes
      .filter(c => !existingClassIds.has(c._id.toString()))
      .filter(c => c.teacher && c.students && c.students.length > 0);

    const results = {
      processed: 0,
      created: 0,
      skipped: 0,
      details: []
    };

    for (const classObj of classesNeedingCommission) {
      try {
        const teacherSharePercentage = classObj.teacher.salaryPercentage || 70;
        const pricePerStudent = classObj.price || 0;
        const teacherSharePerStudent = pricePerStudent * (teacherSharePercentage / 100);
        const totalAmount = teacherSharePerStudent * classObj.students.length;

        // إنشاء العمولة
        const commission = new TeacherCommission({
          schoolId: schoolId,
          teacher: classObj.teacher._id,
          class: classObj._id,
          month: month,
          totalAmount: totalAmount,
          percentage: teacherSharePercentage,
          status: 'pending',
          totalPaid: 0,
          remainingAmount: totalAmount,
          recordedBy: req.user?.id || null,
          students: classObj.students.map(s => ({
            student: s._id,
            studentName: s.name,
            attendancesCount: 0,
            teacherShare: teacherSharePerStudent,
            status: 'pending',
            isActive: true
          }))
        });

        await commission.save();

        results.created++;
        results.details.push({
          classId: classObj._id,
          className: classObj.name,
          teacherId: classObj.teacher._id,
          teacherName: classObj.teacher.name,
          totalAmount: totalAmount,
          studentsCount: classObj.students.length
        });

      } catch (err) {
        results.skipped++;
        results.details.push({
          classId: classObj._id,
          className: classObj.name,
          error: err.message
        });
      }
      results.processed++;
    }

    res.json({
      success: true,
      message: `تم إنشاء ${results.created} عمولة تلقائياً`,
      results: results,
      month: month,
      schoolId: schoolId
    });

  } catch (err) {
    console.error('❌ خطأ في الحساب التلقائي للمستحقات:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
//
// ==============================================
// ✅ نقطة نهاية لجلب تفاصيل الحصة مع الطلاب ومدفوعاتهم وحضورهم الافتراضي
// ==============================================
app.get('/api/classes/:classId/students-with-attendance', async (req, res) => {
  try {
    const { classId } = req.params;
    const { month, startDate, endDate } = req.query;
    
    // جلب الحصة مع جميع الطلاب
    const classObj = await Class.findById(classId)
      .populate('teacher', 'name salaryPercentage')
      .populate('students', 'name studentId parentPhone academicYear');

    if (!classObj) {
      return res.status(404).json({ success: false, error: 'الحصة غير موجودة' });
    }

    // تحديد نطاق التاريخ (الشهر الحالي أو المحدد)
    let targetMonth = month || new Date().toISOString().slice(0, 7);
    const [year, monthNum] = targetMonth.split('-').map(Number);
    const start = startDate ? new Date(startDate) : new Date(year, monthNum - 1, 1);
    const end = endDate ? new Date(endDate) : new Date(year, monthNum, 0);
    end.setHours(23, 59, 59, 999);

    // جلب جميع الحصص الحية لهذه الحصة في الفترة
    const liveClasses = await LiveClass.find({
      class: classId,
      date: { $gte: start, $lte: end },
      status: { $in: ['scheduled', 'ongoing', 'completed'] }
    }).sort({ date: 1, startTime: 1 });

    // جلب المدفوعات للطلاب في هذه الحصة
    const payments = await Payment.find({
      class: classId,
      monthCode: { $regex: `^${targetMonth}` }
    });

    // بناء بيانات كل طالب
    const studentsData = classObj.students.map(student => {
      // حساب المدفوعات
      const studentPayments = payments.filter(p => 
        p.student.toString() === student._id.toString()
      );
      
      const totalPaid = studentPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const totalPending = studentPayments
        .filter(p => p.status === 'pending' || p.status === 'late')
        .reduce((sum, p) => sum + p.amount, 0);
      
      const totalAmount = studentPayments.reduce((sum, p) => sum + p.amount, 0);
      
      // حساب الحضور لكل يوم
      const attendanceByDate = {};
      liveClasses.forEach(lc => {
        const dateStr = lc.date.toISOString().split('T')[0];
        const attendanceRecord = lc.attendance.find(
          att => att.student.toString() === student._id.toString()
        );
        
        attendanceByDate[dateStr] = {
          status: attendanceRecord?.status || 'absent',
          joinedAt: attendanceRecord?.joinedAt,
          className: lc.class?.name,
          startTime: lc.startTime
        };
      });

      // حساب عدد الحصص الحاضرة والغائبة
      const presentCount = Object.values(attendanceByDate).filter(a => a.status === 'present').length;
      const absentCount = Object.values(attendanceByDate).filter(a => a.status === 'absent').length;
      const lateCount = Object.values(attendanceByDate).filter(a => a.status === 'late').length;
      const totalClasses = liveClasses.length;

      return {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
        academicYear: student.academicYear,
        parentPhone: student.parentPhone,
        payment: {
          totalAmount,
          totalPaid,
          totalPending,
          status: totalPaid >= totalAmount ? 'paid' : totalPaid > 0 ? 'partial' : 'pending',
          payments: studentPayments
        },
        attendance: {
          byDate: attendanceByDate,
          summary: {
            present: presentCount,
            absent: absentCount,
            late: lateCount,
            total: totalClasses,
            attendanceRate: totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0
          }
        },
        canEditPayment: true,
        canEditTeacherShare: true
      };
    });

    // حساب إحصائيات عامة
    const summary = {
      totalStudents: studentsData.length,
      totalPaid: studentsData.reduce((sum, s) => sum + s.payment.totalPaid, 0),
      totalPending: studentsData.reduce((sum, s) => sum + s.payment.totalPending, 0),
      totalAmount: studentsData.reduce((sum, s) => sum + s.payment.totalAmount, 0),
      totalPresent: studentsData.reduce((sum, s) => sum + s.attendance.summary.present, 0),
      totalAbsent: studentsData.reduce((sum, s) => sum + s.attendance.summary.absent, 0),
      totalLate: studentsData.reduce((sum, s) => sum + s.attendance.summary.late, 0),
      averageAttendance: studentsData.length > 0 
        ? Math.round(studentsData.reduce((sum, s) => sum + s.attendance.summary.attendanceRate, 0) / studentsData.length)
        : 0
    };

    // أيام الحصص القادمة (للأيام القادمة فقط)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const upcomingDays = [];
    
    // جلب أيام الأسبوع التي فيها حصص
    const daysOfWeek = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const scheduleDays = classObj.schedule?.map(s => s.day) || [];
    
    // توليد الأيام القادمة (30 يوم)
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dayName = daysOfWeek[date.getDay()];
      
      if (scheduleDays.includes(dayName)) {
        const dateStr = date.toISOString().split('T')[0];
        const hasClass = liveClasses.some(lc => 
          lc.date.toISOString().split('T')[0] === dateStr
        );
        
        upcomingDays.push({
          date: dateStr,
          dayName: dayName,
          hasClass: true,
          isPast: date < today,
          isToday: date.getTime() === today.getTime(),
          className: classObj.name,
          schedule: classObj.schedule?.find(s => s.day === dayName) || null
        });
      }
    }

    res.json({
      success: true,
      data: {
        class: {
          _id: classObj._id,
          name: classObj.name,
          subject: classObj.subject,
          price: classObj.price,
          paymentSystem: classObj.paymentSystem,
          teacher: {
            _id: classObj.teacher?._id,
            name: classObj.teacher?.name,
            salaryPercentage: classObj.teacher?.salaryPercentage || 70
          }
        },
        period: {
          start,
          end,
          month: targetMonth
        },
        summary,
        upcomingDays,
        liveClasses: liveClasses.map(lc => ({
          _id: lc._id,
          date: lc.date,
          startTime: lc.startTime,
          status: lc.status,
          attendanceCount: lc.attendance?.length || 0
        })),
        students: studentsData
      }
    });

  } catch (err) {
    console.error('❌ خطأ في جلب بيانات الطلاب مع الحضور:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================
// ✅ نقطة نهاية لتحديد مبلغ دفعة طالب
// ==============================================
app.put('/api/payments/:id/adjust-amount', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    if (!amount || amount < 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'المبلغ يجب أن يكون أكبر من أو يساوي صفر' 
      });
    }

    const payment = await Payment.findById(paymentId)
      .populate('student', 'name studentId')
      .populate('class', 'name subject');

    if (!payment) {
      return res.status(404).json({ success: false, error: 'الدفعة غير موجودة' });
    }

    const oldAmount = payment.amount;
    payment.amount = amount;
    if (reason) {
      payment.notes = payment.notes ? `${payment.notes} | تعديل: ${reason}` : `تعديل: ${reason}`;
    }
    await payment.save();

    // تحديث العمولة المرتبطة إذا وجدت
    if (payment.commissionId) {
      const commission = await TeacherCommission.findById(payment.commissionId);
      if (commission) {
        // إعادة حساب المبلغ الإجمالي للعمولة
        const allPayments = await Payment.find({ 
          commissionId: payment.commissionId,
          status: 'paid'
        });
        
        const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
        
        // تحديث حصة الطالب في العمولة
        const studentIndex = commission.students.findIndex(
          s => s.student.toString() === payment.student._id.toString()
        );
        if (studentIndex !== -1) {
          commission.students[studentIndex].teacherShare = amount * (commission.percentage / 100);
        }
        
        commission.totalAmount = commission.students.reduce((sum, s) => sum + s.teacherShare, 0);
        commission.totalPaid = totalPaid;
        commission.remainingAmount = commission.totalAmount - commission.totalPaid;
        commission.updateStatus();
        await commission.save();
      }
    }

    res.json({
      success: true,
      message: `تم تعديل مبلغ الدفعة من ${oldAmount} إلى ${amount} د.ج`,
      payment: {
        _id: payment._id,
        amount: payment.amount,
        oldAmount: oldAmount,
        student: payment.student,
        class: payment.class,
        notes: payment.notes
      }
    });

  } catch (err) {
    console.error('❌ خطأ في تعديل مبلغ الدفعة:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================
// ✅ نقطة نهاية لتعديل نسبة الأستاذ في الحصة
// ==============================================
app.put('/api/classes/:classId/teacher-percentage', async (req, res) => {
  try {
    const { classId } = req.params;
    const { percentage } = req.body;

    if (!percentage || percentage < 0 || percentage > 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'النسبة يجب أن تكون بين 0 و 100' 
      });
    }

    // تحديث نسبة الأستاذ في الحصة
    const classObj = await Class.findById(classId)
      .populate('teacher', 'name salaryPercentage');

    if (!classObj) {
      return res.status(404).json({ success: false, error: 'الحصة غير موجودة' });
    }

    // تحديث نسبة الأستاذ
    if (classObj.teacher) {
      const teacher = await Teacher.findById(classObj.teacher._id);
      if (teacher) {
        teacher.salaryPercentage = percentage / 100;
        await teacher.save();
      }
    }

    // تحديث العمولات الحالية والمستقبلية بناءً على النسبة الجديدة
    const commissions = await TeacherCommission.find({
      class: classId,
      status: { $in: ['pending', 'partial'] }
    });

    let updatedCommissions = 0;
    for (const commission of commissions) {
      const oldTotal = commission.totalAmount;
      
      // إعادة حساب مبالغ العمولة بناءً على النسبة الجديدة
      commission.percentage = percentage;
      const totalClassAmount = await Payment.aggregate([
        { $match: { class: classId, monthCode: commission.month } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const classTotal = totalClassAmount[0]?.total || 0;
      const newTotal = classTotal * (percentage / 100);
      
      // توزيع المبلغ الجديد على الطلاب
      const totalStudents = commission.students.length;
      if (totalStudents > 0) {
        const perStudent = newTotal / totalStudents;
        commission.students.forEach(s => {
          s.teacherShare = perStudent;
        });
      }
      
      commission.totalAmount = newTotal;
      commission.remainingAmount = newTotal - commission.totalPaid;
      commission.updateStatus();
      await commission.save();
      updatedCommissions++;
    }

    res.json({
      success: true,
      message: `تم تحديث نسبة الأستاذ إلى ${percentage}%`,
      data: {
        classId: classObj._id,
        className: classObj.name,
        teacherName: classObj.teacher?.name,
        newPercentage: percentage,
        updatedCommissions: updatedCommissions
      }
    });

  } catch (err) {
    console.error('❌ خطأ في تعديل نسبة الأستاذ:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==============================================
// ✅ نقطة نهاية لتحديث حضور طالب في يوم معين
// ==============================================
app.put('/api/attendance/update', async (req, res) => {
  try {
    const { studentId, classId, date, status } = req.body;

    if (!studentId || !classId || !date || !status) {
      return res.status(400).json({ 
        success: false, 
        error: 'البيانات ناقصة: studentId, classId, date, status مطلوبة' 
      });
    }

    // البحث عن الحصة الحية في هذا التاريخ
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    let liveClass = await LiveClass.findOne({
      class: classId,
      date: { $gte: startDate, $lte: endDate }
    });

    // إذا لم توجد حصة حية، قم بإنشائها
    if (!liveClass) {
      const classObj = await Class.findById(classId)
        .populate('students', 'name studentId');
      
      const attendance = classObj.students.map(student => ({
        student: student._id,
        status: 'absent',
        joinedAt: null,
        leftAt: null
      }));

      liveClass = new LiveClass({
        class: classId,
        date: startDate,
        startTime: '08:00',
        endTime: '10:00',
        teacher: classObj.teacher,
        attendance: attendance,
        status: 'scheduled',
        month: startDate.toISOString().slice(0, 7)
      });
      await liveClass.save();
    }

    // تحديث حالة الطالب
    const attendanceIndex = liveClass.attendance.findIndex(
      att => att.student.toString() === studentId
    );

    if (attendanceIndex >= 0) {
      liveClass.attendance[attendanceIndex].status = status;
      if (status === 'present' || status === 'late') {
        liveClass.attendance[attendanceIndex].joinedAt = new Date();
      }
    } else {
      liveClass.attendance.push({
        student: studentId,
        status: status,
        joinedAt: status === 'present' || status === 'late' ? new Date() : null,
        leftAt: null
      });
    }

    await liveClass.save();

    res.json({
      success: true,
      message: `تم تحديث حضور الطالب بنجاح`,
      data: {
        studentId,
        classId,
        date,
        status,
        liveClassId: liveClass._id
      }
    });

  } catch (err) {
    console.error('❌ خطأ في تحديث الحضور:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
app.post('/api/accounting/expenses', async (req, res) => {
  try {
    console.log('📝 استلام طلب إضافة مصروف جديد:');
    console.log('📦 Body:', req.body);
    
    const { 
      schoolId, 
      description, 
      amount, 
      category, 
      type, 
      paymentMethod, 
      date, 
      notes,
      recipient,
      receiptNumber,
      status,
      recordedBy
    } = req.body;

    // ==============================================
    // ✅ 1. التحقق من البيانات المطلوبة
    // ==============================================
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        error: 'وصف المصروف مطلوب'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'المبلغ يجب أن يكون أكبر من صفر'
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'تصنيف المصروف مطلوب'
      });
    }

    // ==============================================
    // ✅ 2. التحقق من وجود المدرسة
    // ==============================================
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف المدرسة غير صالح'
      });
    }

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'المدرسة غير موجودة'
      });
    }

    console.log(`🏫 المدرسة: ${school.name} (${schoolId})`);

    // ==============================================
    // ✅ 3. إنشاء سجل المصروف في Expense Schema
    // ==============================================
    const expenseData = {
      schoolId: schoolId,
      description: description.trim(),
      amount: amount,
      category: category,
      type: type || 'operational',
      paymentMethod: paymentMethod || 'cash',
      date: date ? new Date(date) : new Date(),
      status: status || 'paid',
      receiptNumber: receiptNumber || `EXP-${Date.now().toString().slice(-8)}`,
      recordedBy: recordedBy || null,
      notes: notes || '',
      recipient: recipient || ''
    };

    const expense = new Expense(expenseData);
    await expense.save();
    
    console.log(`✅ تم حفظ المصروف في Expense: ${expense._id}`);

    // ==============================================
    // ✅ 4. إنشاء سجل في FinancialTransaction (للتكامل مع المعاملات اليومية)
    // ==============================================
    const transactionData = {
      schoolId: schoolId,
      type: 'expense',
      amount: amount,
      description: description.trim(),
      category: category,
      date: date ? new Date(date) : new Date(),
      recordedBy: recordedBy || null,
      reference: expense._id.toString()
    };

    const transaction = new FinancialTransaction(transactionData);
    await transaction.save();
    
    console.log(`✅ تم حفظ المعاملة المالية: ${transaction._id}`);

    // ==============================================
    // ✅ 5. إرجاع الاستجابة
    // ==============================================
    res.status(201).json({
      success: true,
      message: 'تم إضافة المصروف بنجاح',
      expense: {
        _id: expense._id,
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        paymentMethod: expense.paymentMethod,
        date: expense.date,
        status: expense.status,
        receiptNumber: expense.receiptNumber,
        notes: expense.notes
      },
      transaction: {
        _id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        date: transaction.date
      },
      school: {
        _id: school._id,
        name: school.name,
        schoolKey: school.schoolKey
      }
    });

  } catch (err) {
    console.error('❌ خطأ في إضافة المصروف:', err);
    
    // معالجة أخطاء التحقق
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'خطأ في صحة البيانات',
        details: errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'فشل في إضافة المصروف: ' + err.message
    });
  }
});
//
// ==============================================
// ✅ نقطة نهاية بديلة لإضافة مصروف (متوافقة مع الطلب)
// ==============================================
app.post('/api/accounting/transactions', async (req, res) => {
  try {
    console.log('📝 استلام طلب إضافة معاملة مالية:');
    console.log('📦 Body:', req.body);
    
    const { 
      schoolId, 
      type, 
      amount, 
      description, 
      category, 
      date, 
      recordedBy,
      reference,
      student
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'نوع المعاملة غير صالح (يجب أن يكون income أو expense)'
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'المبلغ يجب أن يكون أكبر من صفر'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        error: 'وصف المعاملة مطلوب'
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        error: 'تصنيف المعاملة مطلوب'
      });
    }

    // التحقق من المدرسة
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف المدرسة غير صالح'
      });
    }

    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'المدرسة غير موجودة'
      });
    }

    // إنشاء المعاملة المالية
    const transactionData = {
      schoolId: schoolId,
      type: type,
      amount: amount,
      description: description.trim(),
      category: category,
      date: date ? new Date(date) : new Date(),
      recordedBy: recordedBy || null,
      reference: reference || `TRX-${Date.now().toString().slice(-8)}`,
      student: student || null
    };

    const transaction = new FinancialTransaction(transactionData);
    await transaction.save();
    
    console.log(`✅ تم حفظ المعاملة المالية: ${transaction._id}`);

    // إذا كانت المعاملة من نوع expense، قم بإنشاء سجل في Expense أيضاً
    if (type === 'expense') {
      try {
        const expenseData = {
          schoolId: schoolId,
          description: description.trim(),
          amount: amount,
          category: category,
          type: 'operational',
          paymentMethod: 'cash',
          date: date ? new Date(date) : new Date(),
          status: 'paid',
          receiptNumber: `EXP-${Date.now().toString().slice(-8)}`,
          recordedBy: recordedBy || null,
          notes: `تم إنشاؤها من المعاملة المالية ${transaction._id}`
        };

        const expense = new Expense(expenseData);
        await expense.save();
        console.log(`✅ تم إنشاء سجل مصروف مرتبط: ${expense._id}`);
      } catch (expenseErr) {
        console.warn('⚠️ لم يتم إنشاء سجل المصروف:', expenseErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'تم إضافة المعاملة المالية بنجاح',
      transaction: {
        _id: transaction._id,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        category: transaction.category,
        date: transaction.date,
        reference: transaction.reference
      },
      school: {
        _id: school._id,
        name: school.name,
        schoolKey: school.schoolKey
      }
    });

  } catch (err) {
    console.error('❌ خطأ في إضافة المعاملة المالية:', err);
    res.status(500).json({
      success: false,
      error: 'فشل في إضافة المعاملة المالية: ' + err.message
    });
  }
});

//
// 

// ==============================================
// ✅ نقطة نهاية للحصول على جميع المصروفات (للاختبار)
// ==============================================
app.get('/api/accounting/expenses', async (req, res) => {
  try {
    const { schoolId, startDate, endDate, category, status } = req.query;
    
    const query = {};
    if (schoolId) query.schoolId = schoolId;
    if (category) query.category = category;
    if (status) query.status = status;
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate('recordedBy', 'username fullName')
      .sort({ date: -1 });

    res.json({
      success: true,
      count: expenses.length,
      expenses: expenses
    });
  } catch (err) {
    console.error('❌ خطأ في جلب المصروفات:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// ✅ نقطة نهاية لحذف مصروف
// ==============================================
app.delete('/api/accounting/expenses/:id', async (req, res) => {
  try {
    const expenseId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(expenseId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف المصروف غير صالح'
      });
    }

    const expense = await Expense.findById(expenseId);
    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'المصروف غير موجود'
      });
    }

    // حذف المعاملة المالية المرتبطة
    await FinancialTransaction.deleteMany({
      reference: expenseId
    });

    // حذف المصروف
    await Expense.findByIdAndDelete(expenseId);

    res.json({
      success: true,
      message: 'تم حذف المصروف بنجاح'
    });
  } catch (err) {
    console.error('❌ خطأ في حذف المصروف:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// 14. جلب الحصص حسب المستوى الدراسي
// ==============================================
app.get('/api/classes/by-level/:academicYear', async (req, res) => {
  try {
    const academicYear = req.params.academicYear;
    const schoolId = req.user?.schoolId || req.query.schoolId;
    
    console.log(`📚 جلب حصص المستوى: ${academicYear}`);
    
    const query = { academicYear: academicYear };
    if (schoolId) query.schoolId = schoolId;

    const classes = await Class.find(query)
      .populate('teacher', 'name')
      .populate('students', 'name studentId')
      .populate('schedule.classroom', 'name')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: classes,
      count: classes.length
    });

  } catch (err) {
    console.error('❌ خطأ في جلب حصص المستوى:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
  // PUT /api/payments/:id/amount
  app.put('/api/payments/:id/amount', async (req, res) => {
    try {
        const { amount } = req.body;
        const payment = await Payment.findByIdAndUpdate(
            req.params.id,
            { amount },
            { new: true }
        ).populate('student').populate('class');
        
        if (!payment) {
            return res.status(404).json({ error: 'الدفعة غير موجودة' });
        }
        
        res.json(payment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  });

    // Messages
    app.get('/api/messages',  async (req, res) => {
      try {
        const { messageType, class: classId, startDate, endDate } = req.query;
        const query = {};

        if (messageType) query.messageType = messageType;
        if (classId) query.class = classId;
        if (startDate || endDate) {
          query.sentAt = {};
          if (startDate) query.sentAt.$gte = new Date(startDate);
          if (endDate) query.sentAt.$lte = new Date(endDate);
        }

        const messages = await Message.find(query)
          .populate('sender')
          .populate('class')
          .populate('recipients.student')
          .sort({ sentAt: -1 });
        res.json(messages);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    app.post('/api/messages',  async (req, res) => {
      try {
        const { recipients, content, messageType, class: classId } = req.body;

        // Validate recipients based on message type
        let validatedRecipients = [];

        if (messageType === 'individual' && recipients.student) {
          const student = await Student.findById(recipients.student);
          if (!student) {
            return res.status(400).json({ error: 'الطالب غير موجود' });
          }
          validatedRecipients.push({
            student: student._id,
            parentPhone: student.parentPhone,
            parentEmail: student.parentEmail
          });
        }
        else if (messageType === 'class' && classId) {
          const classObj = await Class.findById(classId).populate('students');
          if (!classObj) {
            return res.status(400).json({ error: 'الحصة غير موجودة' });
          }
          validatedRecipients = classObj.students.map(student => ({
            student: student._id,
            parentPhone: student.parentPhone,
            parentEmail: student.parentEmail
          }));
        }
        else if (messageType === 'group' && recipients.length) {
          for (const recipient of recipients) {
            const student = await Student.findById(recipient.student);
            if (student) {
              validatedRecipients.push({
                student: student._id,
                parentPhone: student.parentPhone,
                parentEmail: student.parentEmail
              });
            }
          }
        }
        else if (messageType === 'payment') {
          // This is handled in the payment route
          return res.status(400).json({ error: 'يجب استخدام طريق الدفع لإرسال رسائل الدفع' });
        }

        if (!validatedRecipients.length) {
          return res.status(400).json({ error: 'لا يوجد مستلمين للرسالة' });
        }

        // Send messages
        const failedRecipients = [];

        for (const recipient of validatedRecipients) {
          try {
            if (recipient.parentPhone) {
              await smsGateway.send(recipient.parentPhone, content);
            }
            if (recipient.parentEmail) {
              await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: recipient.parentEmail,
                subject: 'رسالة من المدرسة',
                text: content
              });
            }
          } catch (err) {
            console.error(`فشل إرسال الرسالة لـ ${recipient.parentPhone || recipient.parentEmail}`, err);
            failedRecipients.push(recipient);
          }
        }

        // Save message record
        const message = new Message({
          sender: req.user.id,
          recipients: validatedRecipients,
          class: classId,
          content,
          messageType,
          status: failedRecipients.length ? 'failed' : 'sent'
        });
        await message.save();

        if (failedRecipients.length) {
          return res.status(207).json({
            message: 'تم إرسال بعض الرسائل وفشل البعض الآخر',
            failedRecipients,
            messageId: message._id
          });
        }

        res.status(201).json({
          message: 'تم إرسال جميع الرسائل بنجاح',
          messageId: message._id
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Financial Transactions
    app.get('/api/transactions',  async (req, res) => {
      try {
        const { type, category, startDate, endDate } = req.query;
        const query = {};

        if (type) query.type = type;
        if (category) query.category = category;
        if (startDate || endDate) {
          query.date = {};
          if (startDate) query.date.$gte = new Date(startDate);
          if (endDate) query.date.$lte = new Date(endDate);
        }

        const transactions = await FinancialTransaction.find(query)
          .populate('recordedBy')
          .sort({ date: -1 });
        res.json(transactions);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Financial Reports
    app.get('/api/reports/financial',  async (req, res) => {
      try {
        const { year } = req.query;
        const matchStage = {};

        if (year) {
          matchStage.date = {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`)
          };
        }

        const report = await FinancialTransaction.aggregate([
          { $match: matchStage },
          {
            $group: {
              _id: {
                type: '$type',
                category: '$category',
                month: { $month: '$date' },
                year: { $year: '$date' }
              },
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          {
            $group: {
              _id: {
                type: '$_id.type',
                category: '$_id.category'
              },
              monthlyData: {
                $push: {
                  month: '$_id.month',
                  year: '$_id.year',
                  totalAmount: '$totalAmount',
                  count: '$count'
                }
              },
              totalAmount: { $sum: '$totalAmount' },
              totalCount: { $sum: '$count' }
            }
          },
          {
            $project: {
              type: '$_id.type',
              category: '$_id.category',
              monthlyData: 1,
              totalAmount: 1,
              totalCount: 1,
              _id: 0
            }
          }
        ]);

        res.json(report);
      } catch (err) {
        res.status(500).json({ error: err.message });

      }
    });





    // Live Classes Routes
// ==============================================
// ✅ GET /api/live-classes - With School ID Filtering
// ==============================================
app.get('/api/live-classes', async (req, res) => {
  try {
    // 1. Get schoolId from query (priority) or from authenticated user
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    console.log('📚 Fetching live classes - schoolId:', schoolId);
    
    // 2. Validate schoolId
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)',
        message: 'School ID is required to fetch live classes'
      });
    }

    // 3. Validate schoolId format
    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف المدرسة غير صالح',
        message: 'Invalid school ID format'
      });
    }

    // 4. Check if school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'المدرسة غير موجودة',
        message: 'School not found'
      });
    }

    // 5. Build query filters
    const { status, date, class: classId, teacher, month, limit = 100 } = req.query;
    const query = { schoolId: schoolId };

    if (status) query.status = status;
    if (classId) query.class = classId;
    if (teacher) query.teacher = teacher;
    if (month) query.month = month;
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    console.log('🔍 Query filters:', JSON.stringify(query, null, 2));

    // 6. Fetch live classes with population
    const liveClasses = await LiveClass.find(query)
      .populate('class', 'name subject price academicYear')
      .populate('teacher', 'name phone email')
      .populate('classroom', 'name location capacity status equipment')
      .populate('attendance.student', 'name studentId parentPhone')
      .populate('createdBy', 'username fullName')
      .sort({ date: -1, startTime: -1 })
      .limit(parseInt(limit));

    console.log(`✅ Found ${liveClasses.length} live classes for school ${schoolId}`);

    // 7. Calculate statistics
    const stats = {
      total: liveClasses.length,
      scheduled: liveClasses.filter(lc => lc.status === 'scheduled').length,
      ongoing: liveClasses.filter(lc => lc.status === 'ongoing').length,
      completed: liveClasses.filter(lc => lc.status === 'completed').length,
      cancelled: liveClasses.filter(lc => lc.status === 'cancelled').length,
      totalAttendance: liveClasses.reduce((sum, lc) => sum + (lc.attendance?.length || 0), 0)
    };

    // 8. Return response
    res.json({
      success: true,
      data: liveClasses,
      stats: stats,
      school: {
        _id: school._id,
        name: school.name,
        schoolKey: school.schoolKey
      },
      count: liveClasses.length,
      filters: {
        status: status || 'all',
        date: date || 'all',
        class: classId || 'all',
        teacher: teacher || 'all',
        month: month || 'all'
      }
    });

  } catch (err) {
    console.error('❌ Error fetching live classes:', err);
    res.status(500).json({
      success: false,
      error: 'فشل في جلب الحصص الحية',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Create Live Class - مع تحديث حالة الغرفة
// ==============================================
// ✅ POST /api/live-classes - Create Live Class with School ID
// ==============================================
// ==============================================
// ✅ POST /api/live-classes - Create Live Class (FIXED)
// ==============================================
app.post('/api/live-classes', async (req, res) => {
  try {
    console.log('📝 Creating live class - Request body:', req.body);
    console.log('👤 User:', req.user);
    
    // 1. Extract data from request
    const { 
      classId, 
      date, 
      startTime, 
      endTime, 
      teacherId, 
      classroomId, 
      status,
      notes,
      schoolId: bodySchoolId
    } = req.body;
    
    // 2. Get schoolId (priority: body > user token)
    const schoolId = bodySchoolId || req.user?.schoolId;
    
    console.log('🏫 schoolId:', schoolId);
    
    // 3. Validate schoolId
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)',
        message: 'School ID is required to create a live class'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(schoolId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف المدرسة غير صالح',
        message: 'Invalid school ID format'
      });
    }

    // 4. Check if school exists
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({
        success: false,
        error: 'المدرسة غير موجودة',
        message: 'School not found'
      });
    }

    // 5. Validate required fields
    if (!classId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد الحصة (classId)',
        message: 'Class ID is required'
      });
    }

    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد التاريخ (date)',
        message: 'Date is required'
      });
    }

    if (!startTime) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد وقت البداية (startTime)',
        message: 'Start time is required'
      });
    }

    if (!teacherId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد الأستاذ (teacherId)',
        message: 'Teacher ID is required'
      });
    }

    // 6. Validate class exists and belongs to school
    const classObj = await Class.findOne({
      _id: classId,
      schoolId: schoolId
    }).populate('teacher').populate('students');

    if (!classObj) {
      return res.status(404).json({
        success: false,
        error: 'الحصة غير موجودة أو لا تنتمي للمدرسة',
        message: 'Class not found or does not belong to this school'
      });
    }

    console.log('📚 Class found:', classObj.name);

    // 7. Validate teacher exists and belongs to school
    const teacher = await Teacher.findOne({
      _id: teacherId,
      schoolId: schoolId
    });

    if (!teacher) {
      return res.status(404).json({
        success: false,
        error: 'الأستاذ غير موجود أو لا ينتمي للمدرسة',
        message: 'Teacher not found or does not belong to this school'
      });
    }

    console.log('👨‍🏫 Teacher found:', teacher.name);

    // 8. Validate classroom if provided
    let classroom = null;
    if (classroomId) {
      classroom = await Classroom.findOne({
        _id: classroomId,
        schoolId: schoolId
      });

      if (!classroom) {
        return res.status(404).json({
          success: false,
          error: 'الغرفة غير موجودة أو لا تنتمي للمدرسة',
          message: 'Classroom not found or does not belong to this school'
        });
      }

      // Check if classroom is in maintenance
      if (classroom.status === 'maintenance') {
        return res.status(400).json({
          success: false,
          error: 'الغرفة قيد الصيانة ولا يمكن استخدامها حالياً',
          message: 'Classroom is under maintenance'
        });
      }

      // Check if classroom is already occupied
      if (classroom.status === 'occupied') {
        return res.status(400).json({
          success: false,
          error: 'الغرفة مشغولة حالياً بحصة أخرى',
          message: 'Classroom is currently occupied'
        });
      }

      console.log('🏫 Classroom found:', classroom.name);
    }

    // 9. Parse and validate date
    const targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'تاريخ غير صالح',
        message: 'Invalid date format'
      });
    }

    // 10. Check for duplicate live class
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingLiveClass = await LiveClass.findOne({
      schoolId: schoolId,
      class: classId,
      date: { $gte: startOfDay, $lte: endOfDay },
      startTime: startTime,
      status: { $in: ['scheduled', 'ongoing'] }
    });

    if (existingLiveClass) {
      return res.status(400).json({
        success: false,
        error: 'توجد حصة مجدولة في نفس الوقت',
        message: 'A live class already exists at this time',
        existingLiveClass: {
          _id: existingLiveClass._id,
          date: existingLiveClass.date,
          startTime: existingLiveClass.startTime,
          status: existingLiveClass.status
        }
      });
    }

    // 11. Check classroom conflict
    if (classroomId) {
      const conflictingClass = await LiveClass.findOne({
        schoolId: schoolId,
        classroom: classroomId,
        date: { $gte: startOfDay, $lte: endOfDay },
        startTime: startTime,
        status: { $in: ['scheduled', 'ongoing'] }
      });

      if (conflictingClass) {
        return res.status(400).json({
          success: false,
          error: 'الغرفة محجوزة لحصة أخرى في هذا الوقت',
          message: 'Classroom is already booked for another class at this time',
          conflictingClass: {
            _id: conflictingClass._id,
            date: conflictingClass.date,
            startTime: conflictingClass.startTime
          }
        });
      }
    }

    // 12. Create attendance records for all students in the class
    const students = classObj.students || [];
    const attendance = students.map(student => ({
      student: student._id,
      status: 'absent',
      joinedAt: null,
      leftAt: null,
      timestamp: new Date(),
      method: 'auto'
    }));

    console.log(`👥 Creating attendance for ${students.length} students`);

    // 13. Create the live class
    const liveClassData = {
      schoolId: schoolId, // ✅ Add schoolId
      class: classId,
      date: targetDate,
      month: targetDate.toISOString().slice(0, 7),
      startTime: startTime,
      endTime: endTime || calculateEndTime(startTime),
      teacher: teacherId,
      classroom: classroomId || undefined,
      attendance: attendance,
      status: status || 'scheduled',
      notes: notes || '',
      createdBy: req.user?.id || null
    };

    const liveClass = new LiveClass(liveClassData);
    await liveClass.save();
    console.log('✅ Live class created:', liveClass._id);

    // 14. Update classroom status to "occupied" if classroom is provided
    let classroomUpdated = false;
    if (classroomId && classroom) {
      classroom.status = 'occupied';
      classroom.updatedAt = new Date();
      await classroom.save();
      classroomUpdated = true;
      console.log(`✅ Classroom ${classroom.name} status updated to "occupied"`);
    }

    // 15. Populate the created live class for response
    const populatedLiveClass = await LiveClass.findById(liveClass._id)
      .populate('class', 'name subject price academicYear')
      .populate('teacher', 'name phone email')
      .populate('classroom', 'name location status')
      .populate('attendance.student', 'name studentId')
      .populate('createdBy', 'username fullName');

    // 16. Return success response
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحصة الحية بنجاح',
      data: populatedLiveClass,
      school: {
        _id: school._id,
        name: school.name,
        schoolKey: school.schoolKey
      },
      statistics: {
        totalStudents: students.length,
        attendanceRecords: attendance.length,
        classroomUpdated: classroomUpdated
      },
      classroomStatus: classroomUpdated ? {
        classroomId: classroomId,
        newStatus: 'occupied',
        message: 'تم تحديث حالة الغرفة إلى مشغولة'
      } : null
    });

  } catch (err) {
    console.error('❌ Error creating live class:', err);
    console.error('❌ Stack:', err.stack);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        success: false,
        error: 'خطأ في صحة البيانات',
        message: errors.join(', '),
        details: errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'فشل في إنشاء الحصة الحية',
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ==============================================
// ✅ Helper function to calculate end time
// ==============================================
function calculateEndTime(startTime) {
  if (!startTime) return '10:00';
  const [hours, minutes] = startTime.split(':').map(Number);
  const endHours = hours + 2; // Default 2 hours duration
  return `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
// Start a live class - تحديث حالة الغرفة إلى مشغولة
app.put('/api/live-classes/:id/start', async (req, res) => {
  try {
    const liveClassId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(liveClassId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الحصة غير صالح'
      });
    }
    
    const liveClass = await LiveClass.findById(liveClassId)
      .populate('class', 'name subject')
      .populate('classroom', 'name location status');
    
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: 'الحصة الحية غير موجودة'
      });
    }
    
    // التحقق من أن الحصة في حالة مجدولة
    if (liveClass.status === 'ongoing') {
      return res.status(400).json({
        success: false,
        error: 'الحصة قيد التشغيل بالفعل'
      });
    }
    
    if (liveClass.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'الحصة منتهية ولا يمكن بدئها'
      });
    }
    
    // ==============================================
    // تحديث حالة الغرفة إلى "مشغولة" إذا كانت متاحة
    // ==============================================
    let classroomUpdated = false;
    if (liveClass.classroom) {
      const classroom = await Classroom.findById(liveClass.classroom._id);
      if (classroom) {
        if (classroom.status === 'maintenance') {
          return res.status(400).json({
            success: false,
            error: 'الغرفة قيد الصيانة ولا يمكن استخدامها'
          });
        }
        
        // تحديث حالة الغرفة إلى مشغولة
        classroom.status = 'occupied';
        classroom.updatedAt = new Date();
        await classroom.save();
        classroomUpdated = true;
        console.log(`✅ تم تحديث حالة الغرفة ${classroom.name} إلى "مشغولة"`);
      }
    }
    
    // تحديث حالة الحصة
    liveClass.status = 'ongoing';
    liveClass.startTime = liveClass.startTime || new Date().toLocaleTimeString();
    await liveClass.save();
    
    // جلب البيانات المحدثة
    const updatedLiveClass = await LiveClass.findById(liveClassId)
      .populate('class', 'name subject')
      .populate('teacher', 'name')
      .populate('classroom', 'name location status')
      .populate('attendance.student', 'name studentId');
    
    res.json({
      success: true,
      message: 'تم بدء الحصة بنجاح',
      data: updatedLiveClass,
      classroomUpdated: classroomUpdated ? {
        classroomId: liveClass.classroom._id,
        newStatus: 'occupied'
      } : null
    });
    
  } catch (err) {
    console.error('Error starting live class:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// Complete a live class - تحديث حالة الغرفة إلى متاحة
app.put('/api/live-classes/:id/complete', async (req, res) => {
  try {
    const liveClassId = req.params.id;
    const { notes, autoMarkAbsent = true, sendSMS = true } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(liveClassId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الحصة غير صالح'
      });
    }
    
    const liveClass = await LiveClass.findById(liveClassId)
      .populate('class', 'name subject')
      .populate('teacher', 'name')
      .populate('classroom', 'name location status')
      .populate('attendance.student', 'name studentId parentPhone');
    
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: 'الحصة الحية غير موجودة'
      });
    }
    
    // التحقق من أن الحصة قيد التشغيل
    if (liveClass.status === 'completed') {
      return res.status(400).json({
        success: false,
        error: 'الحصة منتهية بالفعل'
      });
    }
    
    if (liveClass.status === 'scheduled') {
      return res.status(400).json({
        success: false,
        error: 'الحصة لم تبدأ بعد'
      });
    }
    
    // ==============================================
    // تحديث حالة الغرفة إلى "متاحة"
    // ==============================================
    let classroomUpdated = false;
    if (liveClass.classroom) {
      const classroom = await Classroom.findById(liveClass.classroom._id);
      if (classroom) {
        classroom.status = 'available';
        classroom.updatedAt = new Date();
        await classroom.save();
        classroomUpdated = true;
        console.log(`✅ تم تحديث حالة الغرفة ${classroom.name} إلى "متاحة"`);
      }
    }
    
    // تحديث حالة الحصة
    liveClass.status = 'completed';
    liveClass.endTime = liveClass.endTime || new Date().toLocaleTimeString();
    if (notes) liveClass.notes = notes;
    await liveClass.save();
    
    // تسجيل الغياب التلقائي للطلاب الغائبين
    let autoMarkResult = null;
    if (autoMarkAbsent) {
      try {
        // استدعاء دالة تسجيل الغياب التلقائي
        const absentStudents = liveClass.attendance.filter(
          att => att.status === 'absent' || !att.status
        );
        
        if (absentStudents.length > 0) {
          // تحديث سجلات الحضور في Attendance Schema
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          for (const att of absentStudents) {
            const student = att.student;
            let attendanceRecord = await Attendance.findOne({
              student: student._id,
              class: liveClass.class._id,
              date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
            });
            
            if (!attendanceRecord) {
              attendanceRecord = new Attendance({
                student: student._id,
                class: liveClass.class._id,
                date: liveClass.date,
                status: 'absent',
                recordedBy: req.user?.id || null
              });
              await attendanceRecord.save();
            }
          }
          
          autoMarkResult = {
            markedAbsent: absentStudents.length,
            totalStudents: liveClass.attendance.length
          };
          
          // إرسال رسائل SMS للطلاب الغائبين
          if (sendSMS) {
            const smsResults = await sendAbsenceNotifications(absentStudents, liveClass);
            autoMarkResult.sms = smsResults;
          }
        }
      } catch (err) {
        console.error('Error in auto-mark absent:', err);
        autoMarkResult = { error: err.message };
      }
    }
    
    // جلب البيانات المحدثة
    const updatedLiveClass = await LiveClass.findById(liveClassId)
      .populate('class', 'name subject')
      .populate('teacher', 'name')
      .populate('classroom', 'name location status')
      .populate('attendance.student', 'name studentId');
    
    res.json({
      success: true,
      message: 'تم إنهاء الحصة بنجاح',
      data: updatedLiveClass,
      autoMarkResult: autoMarkResult,
      classroomUpdated: classroomUpdated ? {
        classroomId: liveClass.classroom._id,
        newStatus: 'available'
      } : null
    });
    
  } catch (err) {
    console.error('Error completing live class:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
    app.put('/api/live-classes/:id',  async (req, res) => {
      try {
        const liveClassId = req.params.id;
        
        if (!mongoose.Types.ObjectId.isValid(liveClassId)) {
          return res.status(400).json({
            success: false,
            error: 'معرف الحصة غير صالح'
          });
        }
        
        const { status, endTime, notes } = req.body;
        
        const updatedLiveClass = await LiveClass.findByIdAndUpdate(
          liveClassId,
          { status, endTime, notes },
          { new: true, runValidators: true }
        )
        .populate('class')
        .populate('teacher')
        .populate('classroom')
        .populate('attendance.student');
        
        if (!updatedLiveClass) {
          return res.status(404).json({
            success: false,
            error: 'الحصة الحية غير موجودة'
          });
        }
        
        res.json({
          success: true,
          message: 'تم تحديث الحصة بنجاح',
          data: updatedLiveClass
        });
        
      } catch (err) {
        console.error('❌ خطأ في تحديث الحصة الحية:', err);
        res.status(500).json({
          success: false,
          error: err.message
        });
      }
    });

    

// ==============================================
// ✅ GET /api/live-classes/:id - Get single live class
// ==============================================
app.get('/api/live-classes/:id', async (req, res) => {
  try {
    const liveClassId = req.params.id;
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    if (!mongoose.Types.ObjectId.isValid(liveClassId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الحصة غير صالح'
      });
    }

    const query = { _id: liveClassId };
    if (schoolId) query.schoolId = schoolId;

    const liveClass = await LiveClass.findOne(query)
      .populate('class', 'name subject price academicYear')
      .populate('teacher', 'name phone email')
      .populate('classroom', 'name location status')
      .populate('attendance.student', 'name studentId parentPhone')
      .populate('createdBy', 'username fullName');

    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: 'الحصة الحية غير موجودة أو لا تنتمي للمدرسة'
      });
    }

    res.json({
      success: true,
      data: liveClass
    });

  } catch (err) {
    console.error('❌ Error fetching live class:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

    

app.post('/api/live-classes/:id/auto-mark-absent', async (req, res) => {
  try {
    const liveClassId = req.params.id;
    const { sendSMS = true, customMessage } = req.body;

    console.log(`🤖 [تلقائي] بدء تسجيل الغياب التلقائي للحصة: ${liveClassId}`);

    // جلب الحصة الحية
    const liveClass = await LiveClass.findById(liveClassId)
      .populate('class', 'name subject')
      .populate('teacher', 'name phone');

    if (!liveClass) {
      return res.status(404).json({ success: false, error: 'الحصة الحية غير موجودة' });
    }

    // جلب الحصة الأصلية مع جميع الطلاب
    const classObj = await Class.findById(liveClass.class._id)
      .populate('students', 'name studentId parentPhone parentEmail academicYear');

    if (!classObj) {
      return res.status(404).json({ success: false, error: 'الحصة الأصلية غير موجودة' });
    }

    // تحديد الطلاب الحاضرين والمتأخرين
    const presentStudentIds = new Set();
    const lateStudentIds = new Set();

    if (liveClass.attendance && liveClass.attendance.length > 0) {
      liveClass.attendance.forEach(att => {
        if (att.status === 'present') {
          presentStudentIds.add(att.student.toString());
        } else if (att.status === 'late') {
          lateStudentIds.add(att.student.toString());
        }
      });
    }

    // تحديد الطلاب الغائبين
    const allStudents = classObj.students;
    const absentStudents = allStudents.filter(student => 
      !presentStudentIds.has(student._id.toString()) && 
      !lateStudentIds.has(student._id.toString())
    );

    console.log(`📊 إحصائيات الحصة:`);
    console.log(`   - إجمالي الطلاب: ${allStudents.length}`);
    console.log(`   - الحاضرون: ${presentStudentIds.size}`);
    console.log(`   - المتأخرون: ${lateStudentIds.size}`);
    console.log(`   - الغائبون: ${absentStudents.length}`);

    // ==============================================
    // إنشاء سجلات في Attendance Schema للطلاب الغائبين
    // ==============================================
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let updatedCount = 0;
    const attendanceRecords = [];

    for (const student of absentStudents) {
      // البحث عن سجل حضور موجود لهذا الطالب في هذا اليوم
      let attendanceRecord = await Attendance.findOne({
        student: student._id,
        class: liveClass.class._id,
        date: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      if (!attendanceRecord) {
        // إنشاء سجل غياب جديد
        attendanceRecord = new Attendance({
          student: student._id,
          class: liveClass.class._id,
          date: liveClass.date,
          status: 'absent',
          recordedBy: req.user?.id || null
        });
        await attendanceRecord.save();
        attendanceRecords.push(attendanceRecord);
        updatedCount++;
      }

      // تحديث LiveClass.attendance
      const existingAttendance = liveClass.attendance.find(
        att => att.student.toString() === student._id.toString()
      );

      if (!existingAttendance) {
        liveClass.attendance.push({
          student: student._id,
          status: 'absent',
          joinedAt: null,
          leftAt: null,
          autoMarked: true,
          markedAt: new Date(),
          attendanceSchemaId: attendanceRecord._id
        });
      }
    }

    await liveClass.save();
    console.log(`✅ تم تحديث سجلات الحضور: تمت إضافة ${updatedCount} طالب كغائبين في Attendance Schema`);

    // ==============================================
    // إرسال رسائل SMS للطلاب الغائبين
    // ==============================================
    const smsResults = { sent: 0, failed: 0, details: [] };

    if (sendSMS && absentStudents.length > 0) {
      console.log(`📱 جاري إرسال رسائل للطلاب الغائبين...`);
      
      for (const student of absentStudents) {
        if (student.parentPhone) {
          try {
            let cleanPhone = student.parentPhone.trim();
            if (!cleanPhone.startsWith('+')) {
              if (cleanPhone.startsWith('0')) {
                cleanPhone = '+213' + cleanPhone.substring(1);
              } else {
                cleanPhone = '+213' + cleanPhone;
              }
            }

            const smsMessage = customMessage || 
              `📚 إشعار غياب\n` +
              `عزيزي ولي أمر الطالب ${student.name}\n` +
              `يؤسفنا إعلامكم بأن الطالب غائب عن حصة ${liveClass.class?.name || 'المدرسة'}\n` +
              `📅 التاريخ: ${new Date(liveClass.date).toLocaleDateString('ar-EG')}\n` +
              `⏰ الوقت: ${liveClass.startTime}\n` +
              `👨‍🏫 المعلم: ${liveClass.teacher?.name || 'غير محدد'}\n` +
              `📞 نرجو التواصل مع الإدارة.`;

            const smsResult = await smsGateway.sendIndividualSMS(cleanPhone, smsMessage);
            
            if (smsResult.success) {
              smsResults.sent++;
              smsResults.details.push({ student: student.name, success: true });
              
              // حفظ سجل الرسالة
              const messageRecord = new Message({
                sender: req.user?.id || null,
                recipients: [{ student: student._id, parentPhone: cleanPhone }],
                class: liveClass.class._id,
                content: smsMessage,
                messageType: 'individual',
                status: 'sent'
              });
              await messageRecord.save({ validateBeforeSave: false });
            } else {
              smsResults.failed++;
              smsResults.details.push({ student: student.name, success: false, error: smsResult.error });
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (err) {
            smsResults.failed++;
            smsResults.details.push({ student: student.name, success: false, error: err.message });
          }
        }
      }
    }

    res.json({
      success: true,
      message: `✅ تم تسجيل ${absentStudents.length} طالب كغائبين في Attendance Schema${sendSMS ? ` وإرسال ${smsResults.sent} رسالة إشعار` : ''}`,
      data: {
        liveClassId: liveClass._id,
        className: liveClass.class?.name,
        classDate: liveClass.date,
        statistics: {
          totalStudents: allStudents.length,
          present: presentStudentIds.size,
          late: lateStudentIds.size,
          absent: absentStudents.length,
          newlyMarkedAbsent: updatedCount
        },
        absentStudents: absentStudents.map(s => ({
          _id: s._id,
          name: s.name,
          studentId: s.studentId,
          parentPhone: s.parentPhone
        })),
        smsResults: sendSMS ? smsResults : null
      }
    });

  } catch (err) {
    console.error('❌ خطأ في تسجيل الغياب التلقائي:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
app.get('/api/live-classes/:id/absence-stats', async (req, res) => {
  try {
      const liveClass = await LiveClass.findById(req.params.id)
          .populate('class', 'name')
          .populate('attendance.student', 'name studentId');
          
      if (!liveClass) {
          return res.status(404).json({ error: 'الحصة غير موجودة' });
      }
      
      const stats = {
          present: liveClass.attendance.filter(a => a.status === 'present').length,
          late: liveClass.attendance.filter(a => a.status === 'late').length,
          absent: liveClass.attendance.filter(a => a.status === 'absent').length,
          total: liveClass.attendance.length
      };
      
      res.json({ success: true, stats });
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});
app.post('/api/live-classes/:id/complete-and-mark-absent', async (req, res) => {
  try {
      const liveClassId = req.params.id;
      
      // تحديث حالة الحصة إلى مكتملة
      const liveClass = await LiveClass.findByIdAndUpdate(
          liveClassId,
          { status: 'completed', endTime: new Date().toLocaleTimeString() },
          { new: true }
      );
      
      if (!liveClass) {
          return res.status(404).json({ error: 'الحصة غير موجودة' });
      }
      
      // ثم استدعاء دالة تسجيل الغياب
      const autoMarkResult = await fetch(`${process.env.API_URL}/api/live-classes/${liveClassId}/auto-mark-absent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sendSMS: true })
      });
      
      const result = await autoMarkResult.json();
      
      res.json({
          success: true,
          message: 'تم إنهاء الحصة وتسجيل الغياب بنجاح',
          liveClass,
          autoMark: result
      });
      
  } catch (err) {
      res.status(500).json({ error: err.message });
  }
});

// ==============================================
// نقطة نهاية للحصول على غيابات طالب معين (بدون مصادقة)
// ==============================================
// ==============================================
// نقطة نهاية محسنة لجلب غيابات الطالب من Attendance Schema
// ==============================================
app.get('/api/students/:studentId/absences', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

    console.log(`📊 جلب غيابات الطالب من Attendance Schema: ${studentId}`);

    // التحقق من صحة المعرف
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, error: 'معرف الطالب غير صالح' });
    }

    // التحقق من وجود الطالب
    const student = await Student.findById(studentId)
      .select('name studentId academicYear parentName parentPhone');
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'الطالب غير موجود' });
    }

    // بناء استعلام التاريخ
    let dateQuery = {};
    const now = new Date();
    
    if (startDate && endDate) {
      dateQuery = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // افتراضي: آخر 90 يوم
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      dateQuery = {
        $gte: ninetyDaysAgo,
        $lte: now
      };
    }

    // ==============================================
    // جلب سجلات الحضور من Attendance Schema
    // ==============================================
    const attendanceRecords = await Attendance.find({
      student: studentId,
      date: dateQuery
    })
      .populate('class', 'name subject')
      .populate('recordedBy', 'username fullName')
      .sort({ date: -1 });

    console.log(`📊 تم العثور على ${attendanceRecords.length} سجل حضور للطالب`);

    // ==============================================
    // الحصول على جميع الحصص التي الطالب مسجل فيها
    // ==============================================
    const studentClasses = await Class.find({ students: studentId })
      .select('_id name subject');

    // ==============================================
    // بناء قائمة بجميع الأيام التي توجد فيها حصص
    // (للحصول على إحصائيات دقيقة، نحتاج إلى LiveClass)
    // ==============================================
    const classIds = studentClasses.map(c => c._id);
    
    const liveClasses = await LiveClass.find({
      class: { $in: classIds },
      date: dateQuery,
      status: { $in: ['completed', 'ongoing'] }
    })
      .populate('class', 'name subject')
      .populate('teacher', 'name')
      .sort({ date: -1 });

    // ==============================================
    // إنشاء خريطة لسجلات الحضور من Attendance Schema
    // ==============================================
    const attendanceMap = new Map();
    attendanceRecords.forEach(record => {
      const key = `${record.class._id.toString()}_${record.date.toISOString().split('T')[0]}`;
      attendanceMap.set(key, record);
    });

    // ==============================================
    // بناء قائمة الحضور/الغياب لكل حصة حية
    // ==============================================
    const absenceRecords = [];
    let totalPresent = 0, totalAbsent = 0, totalLate = 0;

    for (const liveClass of liveClasses) {
      const dateKey = liveClass.date.toISOString().split('T')[0];
      const classKey = `${liveClass.class._id.toString()}_${dateKey}`;
      const attendanceRecord = attendanceMap.get(classKey);
      
      // تحديد الحالة: إذا كان هناك سجل في Attendance نأخذ منه، وإلا غائب
      let status = 'absent';
      if (attendanceRecord) {
        status = attendanceRecord.status;
      } else {
        // إذا لم يكن هناك سجل، نتحقق من LiveClass.attendance كبديل
        const liveClassRecord = liveClass.attendance.find(
          att => att.student.toString() === studentId
        );
        if (liveClassRecord) {
          status = liveClassRecord.status;
        }
      }

      // تحديث الإحصائيات
      if (status === 'present') totalPresent++;
      else if (status === 'absent') totalAbsent++;
      else if (status === 'late') totalLate++;

      // تنسيق السجل للعرض
      absenceRecords.push({
        _id: liveClass._id,
        attendanceSchemaId: attendanceRecord?._id || null,
        date: liveClass.date,
        dateFormatted: new Date(liveClass.date).toLocaleDateString('ar-EG'),
        dayName: new Date(liveClass.date).toLocaleDateString('ar-EG', { weekday: 'long' }),
        startTime: liveClass.startTime,
        endTime: liveClass.endTime,
        status: status,
        statusText: status === 'present' ? 'حاضر' : (status === 'late' ? 'متأخر' : 'غائب'),
        className: liveClass.class?.name || 'غير محدد',
        subject: liveClass.class?.subject || 'غير محدد',
        teacherName: liveClass.teacher?.name || 'غير محدد',
        classroom: liveClass.classroom?.name || 'غير محدد',
        notes: liveClass.notes,
        joinedAt: attendanceRecord?.date || liveClass.attendance.find(a => a.student.toString() === studentId)?.joinedAt,
        recordedBy: attendanceRecord?.recordedBy?.username || 'تلقائي',
        autoMarked: !attendanceRecord
      });
    }

    const totalClasses = liveClasses.length;
    const attendanceRate = totalClasses > 0 
      ? Math.round(((totalPresent + totalLate) / totalClasses) * 100) 
      : 100;

    // تجميع الغيابات حسب الحصة
    const absencesByClassMap = new Map();
    absenceRecords.forEach(record => {
      if (record.status === 'absent') {
        if (!absencesByClassMap.has(record.className)) {
          absencesByClassMap.set(record.className, {
            className: record.className,
            subject: record.subject,
            count: 0,
            records: []
          });
        }
        const classData = absencesByClassMap.get(record.className);
        classData.count++;
        classData.records.push({ 
          date: record.dateFormatted, 
          teacher: record.teacherName,
          autoMarked: record.autoMarked
        });
      }
    });

    // ==============================================
    // الرد النهائي
    // ==============================================
    res.json({
      success: true,
      student: {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
        academicYear: student.academicYear,
        parentName: student.parentName,
        parentPhone: student.parentPhone
      },
      statistics: {
        totalClasses: totalClasses,
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate,
        attendanceRate: attendanceRate,
        period: {
          startDate: startDate || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: endDate || new Date().toISOString().split('T')[0]
        }
      },
      absencesByClass: Array.from(absencesByClassMap.values()),
      recentAbsences: absenceRecords.slice(0, 20),
      allAbsences: absenceRecords
    });

  } catch (err) {
    console.error('❌ خطأ في جلب غيابات الطالب:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// نقطة نهاية للحصول على إحصائيات غياب الطالب (ملخص سريع)
// ==============================================
app.get('/api/students/:studentId/absences-summary', async (req, res) => {
  try {
      const { studentId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
          return res.status(400).json({
              success: false,
              error: 'معرف الطالب غير صالح'
          });
      }

      const student = await Student.findById(studentId).select('name studentId');
      if (!student) {
          return res.status(404).json({
              success: false,
              error: 'الطالب غير موجود'
          });
      }

      // إحصائيات الشهر الحالي
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthlyStats = await LiveClass.aggregate([
          {
              $match: {
                  date: { $gte: startOfMonth, $lte: endOfMonth },
                  'attendance.student': new mongoose.Types.ObjectId(studentId),
                  status: { $in: ['completed', 'ongoing'] }
              }
          },
          {
              $unwind: '$attendance'
          },
          {
              $match: {
                  'attendance.student': new mongoose.Types.ObjectId(studentId)
              }
          },
          {
              $group: {
                  _id: '$attendance.status',
                  count: { $sum: 1 }
              }
          }
      ]);

      // إحصائيات آخر 7 أيام
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weeklyStats = await LiveClass.aggregate([
          {
              $match: {
                  date: { $gte: weekAgo, $lte: now },
                  'attendance.student': new mongoose.Types.ObjectId(studentId),
                  status: { $in: ['completed', 'ongoing'] }
              }
          },
          {
              $unwind: '$attendance'
          },
          {
              $match: {
                  'attendance.student': new mongoose.Types.ObjectId(studentId)
              }
          },
          {
              $group: {
                  _id: '$attendance.status',
                  count: { $sum: 1 }
              }
          }
      ]);

      const getCount = (stats, status) => {
          const found = stats.find(s => s._id === status);
          return found ? found.count : 0;
      };

      const monthlyPresent = getCount(monthlyStats, 'present');
      const monthlyLate = getCount(monthlyStats, 'late');
      const monthlyAbsent = getCount(monthlyStats, 'absent');
      const monthlyTotal = monthlyPresent + monthlyLate + monthlyAbsent;
      const monthlyAttendanceRate = monthlyTotal > 0 
          ? Math.round(((monthlyPresent + monthlyLate) / monthlyTotal) * 100) 
          : 100;

      const weeklyPresent = getCount(weeklyStats, 'present');
      const weeklyLate = getCount(weeklyStats, 'late');
      const weeklyAbsent = getCount(weeklyStats, 'absent');
      const weeklyTotal = weeklyPresent + weeklyLate + weeklyAbsent;
      const weeklyAttendanceRate = weeklyTotal > 0 
          ? Math.round(((weeklyPresent + weeklyLate) / weeklyTotal) * 100) 
          : 100;

      res.json({
          success: true,
          student: {
              _id: student._id,
              name: student.name,
              studentId: student.studentId
          },
          monthly: {
              present: monthlyPresent,
              late: monthlyLate,
              absent: monthlyAbsent,
              total: monthlyTotal,
              attendanceRate: monthlyAttendanceRate,
              monthName: now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })
          },
          weekly: {
              present: weeklyPresent,
              late: weeklyLate,
              absent: weeklyAbsent,
              total: weeklyTotal,
              attendanceRate: weeklyAttendanceRate,
              period: `${weekAgo.toLocaleDateString('ar-EG')} - ${now.toLocaleDateString('ar-EG')}`
          }
      });

  } catch (err) {
      console.error('❌ خطأ في جلب ملخص غيابات الطالب:', err);
      res.status(500).json({
          success: false,
          error: err.message
      });
  }
});

// نقطة نهاية لتهيئة سجلات الغياب لجميع طلاب الحصة
app.post('/api/live-classes/:id/init-attendance', async (req, res) => {
  try {
      const liveClassId = req.params.id;
      
      const liveClass = await LiveClass.findById(liveClassId);
      if (!liveClass) {
          return res.status(404).json({ error: 'الحصة غير موجودة' });
      }
      
      // جلب جميع طلاب الحصة
      const classObj = await Class.findById(liveClass.class).populate('students');
      
      if (!classObj || !classObj.students) {
          return res.status(404).json({ error: 'لا يوجد طلاب في هذه الحصة' });
      }
      
      // إنشاء مصفوفة جديدة للحضور
      const attendanceRecords = [];
      
      // إضافة سجلات لجميع الطلاب (افتراضياً غائب)
      for (const student of classObj.students) {
          // التحقق إذا كان الطالب لديه سجل مسبق
          const existingRecord = liveClass.attendance.find(
              att => att.student.toString() === student._id.toString()
          );
          
          if (existingRecord) {
              // الاحتفاظ بالسجل الموجود
              attendanceRecords.push(existingRecord);
          } else {
              // إضافة سجل جديد كغائب
              attendanceRecords.push({
                  student: student._id,
                  status: 'absent',
                  joinedAt: null,
                  leftAt: null
              });
          }
      }
      
      // تحديث سجلات الحضور
      liveClass.attendance = attendanceRecords;
      await liveClass.save();
      
      res.json({
          success: true,
          message: `تم تهيئة سجلات الحضور لـ ${attendanceRecords.length} طالب`,
          studentsCount: attendanceRecords.length
      });
      
  } catch (err) {
      console.error('Error initializing attendance:', err);
      res.status(500).json({ error: err.message });
  }
});


  // في server.js، تحديث نقطة النهاية /api/live-classes/:id/attendance
  // تحديث نقطة النهاية لتسجيل الغياب وإرسال SMS
  const axios = require('axios');

// ==============================================
// نقطة نهاية محسنة لتسجيل الحضور مع حفظ في Attendance Schema
// ==============================================
app.post('/api/live-classes/:id/attendance', async (req, res) => {
  try {
    const liveClassId = req.params.id;
    const { studentId, status, method, sendSMS = true, customMessage } = req.body;

    console.log(`📝 تسجيل حضور/غياب للحصة ${liveClassId} للطالب ${studentId} - الحالة: ${status}`);

    // التحقق من صحة الـ ID
    if (!mongoose.Types.ObjectId.isValid(liveClassId)) {
      return res.status(400).json({ success: false, error: 'معرف الحصة غير صالح' });
    }

    // البحث عن الحصة الحية
    const liveClass = await LiveClass.findById(liveClassId)
      .populate('class', 'name subject')
      .populate('teacher', 'name');

    if (!liveClass) {
      return res.status(404).json({ success: false, error: 'الحصة الحية غير موجودة' });
    }

    // العثور على الطالب
    let student;
    if (method === 'rfid') {
      const card = await Card.findOne({ uid: studentId }).populate('student');
      if (!card) {
        return res.status(404).json({ success: false, error: 'البطاقة غير مسجلة' });
      }
      student = card.student;
    } else {
      student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ success: false, error: 'الطالب غير موجود' });
      }
    }

    // ==============================================
    // الخطوة 1: تحديث Attendance Schema المنفصل
    // ==============================================
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // البحث عن سجل حضور موجود لهذا الطالب في هذه الحصة في هذا اليوم
    let attendanceRecord = await Attendance.findOne({
      student: student._id,
      class: liveClass.class._id,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (attendanceRecord) {
      // تحديث السجل الموجود
      attendanceRecord.status = status || 'present';
      attendanceRecord.recordedBy = req.user?.id || null;
      await attendanceRecord.save();
      console.log(`✅ تم تحديث Attendance Schema: ${attendanceRecord._id}`);
    } else {
      // إنشاء سجل جديد
      attendanceRecord = new Attendance({
        student: student._id,
        class: liveClass.class._id,
        date: new Date(),
        status: status || 'present',
        recordedBy: req.user?.id || null
      });
      await attendanceRecord.save();
      console.log(`✅ تم إنشاء سجل جديد في Attendance Schema: ${attendanceRecord._id}`);
    }

    // ==============================================
    // الخطوة 2: تحديث LiveClass.attendance (للتكامل مع النظام الحالي)
    // ==============================================
    const existingIndex = liveClass.attendance.findIndex((a) =>
      a.student.toString() === student._id.toString()
    );

    const attendanceRecordLive = {
      student: student._id,
      status: status || 'present',
      method: method || 'manual',
      timestamp: new Date(),
      joinedAt: (status === 'present' || status === 'late') ? new Date() : null,
      attendanceSchemaId: attendanceRecord._id // ربط بالسجل في Attendance Schema
    };

    if (existingIndex >= 0) {
      liveClass.attendance[existingIndex] = attendanceRecordLive;
    } else {
      liveClass.attendance.push(attendanceRecordLive);
    }

    await liveClass.save();
    console.log(`✅ تم تحديث LiveClass.attendance`);

    // ==============================================
    // الخطوة 3: إرسال إشعارات SMS (للغائبين)
    // ==============================================
    const smsResult = { sent: false, error: null };

    if (sendSMS && status === 'absent' && student.parentPhone) {
      try {
        let cleanPhone = student.parentPhone.trim();
        if (!cleanPhone.startsWith('+')) {
          if (cleanPhone.startsWith('0')) {
            cleanPhone = '+213' + cleanPhone.substring(1);
          } else {
            cleanPhone = '+213' + cleanPhone;
          }
        }

        const smsMessage = customMessage || 
          `📚 إشعار غياب\n` +
          `عزيزي ولي أمر الطالب ${student.name}\n` +
          `يؤسفنا إعلامكم بأن الطالب غائب عن حصة ${liveClass.class?.name || 'المدرسة'}\n` +
          `📅 التاريخ: ${new Date(liveClass.date).toLocaleDateString('ar-EG')}\n` +
          `⏰ الوقت: ${liveClass.startTime}\n` +
          `👨‍🏫 المعلم: ${liveClass.teacher?.name || 'غير محدد'}\n` +
          `📞 نرجو التواصل مع الإدارة.`;

        const smsResponse = await smsGateway.sendIndividualSMS(cleanPhone, smsMessage);
        
        if (smsResponse.success) {
          smsResult.sent = true;
          console.log(`✅ تم إرسال رسالة الغياب بنجاح`);
          
          // حفظ سجل الرسالة
          const messageRecord = new Message({
            sender: req.user?.id || null,
            recipients: [{ student: student._id, parentPhone: cleanPhone }],
            class: liveClass.class._id,
            content: smsMessage,
            messageType: 'individual',
            status: 'sent'
          });
          await messageRecord.save({ validateBeforeSave: false });
        } else {
          smsResult.error = smsResponse.error;
          console.error(`❌ فشل إرسال رسالة الغياب: ${smsResponse.error}`);
        }
      } catch (smsError) {
        smsResult.error = smsError.message;
        console.error(`❌ خطأ في إرسال SMS: ${smsError}`);
      }
    }

    // ==============================================
    // الرد على العميل
    // ==============================================
    res.json({
      success: true,
      message: `تم تسجيل ${status === 'present' ? 'الحضور' : status === 'absent' ? 'الغياب' : 'التأخير'} بنجاح${smsResult.sent ? ' وإرسال رسالة لأولياء الأمور' : ''}`,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          parentPhone: student.parentPhone
        },
        class: {
          _id: liveClass.class._id,
          name: liveClass.class.name
        },
        attendance: {
          status: status || 'present',
          recordedAt: new Date(),
          attendanceSchemaId: attendanceRecord._id
        },
        sms: smsResult,
        liveClass: {
          _id: liveClass._id,
          date: liveClass.date,
          startTime: liveClass.startTime
        }
      }
    });

  } catch (err) {
    console.error('❌ خطأ في تسجيل الحضور:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});
  // نقطة نهاية للحصول على حضور حصة حية محددة
  app.get('/api/live-classes/:id/attendance', async (req, res) => {
    try {
      const liveClassId = req.params.id;
      
      if (!mongoose.Types.ObjectId.isValid(liveClassId)) {
        return res.status(400).json({
          success: false,
          error: 'معرف الحصة غير صالح'
        });
      }

      const liveClass = await LiveClass.findById(liveClassId)
        .populate('class', 'name subject')
        .populate('teacher', 'name')
        .populate('classroom', 'name')
        .populate('attendance.student', 'name studentId parentPhone academicYear');

      if (!liveClass) {
        return res.status(404).json({
          success: false,
          error: 'الحصة الحية غير موجودة'
        });
      }

      res.json({
        success: true,
        liveClass: {
          _id: liveClass._id,
          date: liveClass.date,
          startTime: liveClass.startTime,
          endTime: liveClass.endTime,
          status: liveClass.status,
          class: liveClass.class,
          teacher: liveClass.teacher,
          classroom: liveClass.classroom,
          notes: liveClass.notes
        },
        attendance: liveClass.attendance || [],
        summary: {
          total: liveClass.attendance?.length || 0,
          present: liveClass.attendance?.filter(a => a.status === 'present').length || 0,
          absent: liveClass.attendance?.filter(a => a.status === 'absent').length || 0,
          late: liveClass.attendance?.filter(a => a.status === 'late').length || 0
        }
      });

    } catch (err) {
      console.error('Error fetching live class attendance:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });


    // Enhanced attendance endpoint
  // نقطة نهاية لتحديث حضور حصة حية
  app.put('/api/live-classes/:id/attendance', async (req, res) => {
    try {
      const liveClassId = req.params.id;
      const { attendance } = req.body; // مصفوفة من سجلات الحضور

      if (!mongoose.Types.ObjectId.isValid(liveClassId)) {
        return res.status(400).json({
          success: false,
          error: 'معرف الحصة غير صالح'
        });
      }

      const liveClass = await LiveClass.findById(liveClassId);
      if (!liveClass) {
        return res.status(404).json({
          success: false,
          error: 'الحصة الحية غير موجودة'
        });
      }

      // تحديث جميع سجلات الحضور
      if (attendance && Array.isArray(attendance)) {
        liveClass.attendance = attendance.map(att => ({
          student: att.student,
          status: att.status || 'absent',
          joinedAt: att.joinedAt,
          leftAt: att.leftAt,
          timestamp: att.timestamp || new Date()
        }));
      }

      await liveClass.save();

      res.json({
        success: true,
        message: 'تم تحديث الحضور بنجاح',
        attendance: liveClass.attendance
      });

    } catch (err) {
      console.error('Error updating attendance:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
    app.get('/api/live-classes/:classId/report',  async (req, res) => {
      try {
        const { fromDate, toDate } = req.query;
        
        const query = { class: req.params.classId };
        if (fromDate && toDate) {
          query.date = { 
            $gte: new Date(fromDate),
            $lte: new Date(toDate)
          };
        }
        
        const liveClasses = await LiveClass.find(query)
          .populate('attendance.student')
          .sort({ date: 1 });
        
        // Create attendance report
        const report = {
          class: req.params.classId,
          totalClasses: liveClasses.length,
          attendance: {}
        };
        
        // Initialize attendance for all students
        const classObj = await Class.findById(req.params.classId).populate('students');
        classObj.students.forEach(student => {
          report.attendance[student._id] = {
            student: student,
            present: 0,
            absent: 0,
            late: 0,
            total: 0
          };
        });
        
        // Calculate attendance for each student
        liveClasses.forEach(liveClass => {
          liveClass.attendance.forEach(att => {
            if (report.attendance[att.student]) {
              report.attendance[att.student][att.status]++;
              report.attendance[att.student].total++;
            }
          });
        });
        
        res.json(report);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });


  // Add this endpoint in your server.js file, near the other payment endpoints:

  // Get payments for a specific student
  // الحصول على مدفوعات الطالب
  // الحصول على جميع مدفوعات الطالب مع تفاصيل كاملة
// الحصول على مدفوعات الطالب مع تصفية حسب المدرسة
app.get('/api/payments/student/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { status, startDate, endDate, limit = 100 } = req.query;

        // جلب schoolId من التوكن (أفضل) أو من الـ query
        const schoolId = req.user?.schoolId || req.query.schoolId;

        // التحقق من وجود schoolId
        if (!schoolId) {
            return res.status(400).json({
                success: false,
                error: 'schoolId مطلوب للحصول على مدفوعات الطالب'
            });
        }

        console.log(`جلب مدفوعات الطالب: ${studentId} للمدرسة: ${schoolId}`);

        // بناء الاستعلام - إضافة schoolId كشرط أساسي
        const query = {
            student: studentId,
            schoolId: schoolId // ✅ تصفية المدفوعات حسب المدرسة
        };

        if (status && status !== 'all') {
            query.status = status;
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // الحصول على المدفوعات مع جميع البيانات
        const payments = await Payment.find(query)
            .populate({
                path: 'student',
                select: 'name studentId parentPhone academicYear'
            })
            .populate({
                path: 'class',
                select: 'name subject price paymentSystem',
                populate: [
                    { path: 'teacher', model: 'Teacher', select: 'name' },
                    { path: 'schedule.classroom', model: 'Classroom', select: 'name' }
                ]
            })
            .populate('recordedBy', 'username fullName')
            .sort({ createdAt: 1 })
            .limit(parseInt(limit));

        console.log(`تم العثور على ${payments.length} دفعة للطالب ${studentId} في المدرسة ${schoolId}`);

        // إضافة بيانات إضافية لكل دفعة
        const enhancedPayments = payments.map(payment => {
            const paymentObj = payment.toObject();

            // حساب إذا كانت الدفعة متأخرة
            if (payment.status === 'pending' && payment.monthCode) {
                const monthDate = moment(payment.monthCode, 'YYYY-MM');
                if (monthDate.isBefore(moment(), 'month')) {
                    paymentObj.isLate = true;
                }
            }

            // إضافة معلومات الحصة
            if (payment.class) {
                paymentObj.className = payment.class.name;
                paymentObj.subject = payment.class.subject;
                paymentObj.teacherName = payment.class.teacher?.name || 'غير محدد';
            }

            // إضافة معلومات الطالب
            if (payment.student) {
                paymentObj.studentName = payment.student.name;
                paymentObj.studentId = payment.student.studentId;
            }

            // تنسيق التاريخ
            paymentObj.formattedDate = payment.paymentDate
                ? moment(payment.paymentDate).format('YYYY-MM-DD HH:mm')
                : 'لم يتم الدفع';

            paymentObj.createdAtFormatted = moment(payment.createdAt).format('YYYY-MM-DD HH:mm');

            return paymentObj;
        });

        // حساب الإحصائيات
        const summary = {
            total: enhancedPayments.length,
            totalAmount: enhancedPayments.reduce((sum, p) => sum + p.amount, 0),
            paid: enhancedPayments.filter(p => p.status === 'paid').length,
            paidAmount: enhancedPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
            pending: enhancedPayments.filter(p => p.status === 'pending').length,
            pendingAmount: enhancedPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
            late: enhancedPayments.filter(p => p.isLate).length,
            lateAmount: enhancedPayments.filter(p => p.isLate).reduce((sum, p) => sum + p.amount, 0)
        };

        res.json({
            success: true,
            payments: enhancedPayments,
            summary: summary,
            studentInfo: payments[0]?.student || null,
            schoolId: schoolId
        });

    } catch (err) {
        console.error('❌ خطأ في جلب مدفوعات الطالب:', err);
        res.status(500).json({
            success: false,
            error: err.message,
            payments: [],
            summary: {
                total: 0,
                totalAmount: 0,
                paid: 0,
                paidAmount: 0,
                pending: 0,
                pendingAmount: 0,
                late: 0,
                lateAmount: 0
            }
        });
    }
});
  app.post('/api/live-classes/:id/mark-absent', async (req, res) => {
    try {
      const liveClassId = req.params.id;
      const { studentId, sendSMS = true, customMessage } = req.body;

      console.log(`📝 تسجيل غياب للحصة ${liveClassId} للطالب ${studentId}`);

      // التحقق من صحة الـ ID
      if (!mongoose.Types.ObjectId.isValid(liveClassId)) {
        return res.status(400).json({
          success: false,
          error: 'معرف الحصة غير صالح'
        });
      }

      // البحث عن الحصة الحية
      const liveClass = await LiveClass.findById(liveClassId)
        .populate('class', 'name subject')
        .populate('teacher', 'name');

      if (!liveClass) {
        return res.status(404).json({
          success: false,
          error: 'الحصة الحية غير موجودة'
        });
      }

      // العثور على الطالب
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          error: 'الطالب غير موجود'
        });
      }

      // التحقق من تسجيل الطالب في الحصة
      const classObj = await Class.findById(liveClass.class?._id);
      if (classObj) {
        const isEnrolled = classObj.students.some((s) =>
          s.toString() === student._id.toString()
        );
        
        if (!isEnrolled) {
          return res.status(400).json({
            success: false,
            error: 'الطالب غير مسجل في هذه الحصة'
          });
        }
      }

      // إنشاء أو تحديث سجل الحضور
      const existingIndex = liveClass.attendance.findIndex((a) =>
        a.student.toString() === student._id.toString()
      );

      const attendanceRecord = {
        student: student._id,
        status: 'absent',
        method: 'manual',
        timestamp: new Date(),
        markedAsAbsent: true,
        markedAt: new Date()
      };

      if (existingIndex >= 0) {
        liveClass.attendance[existingIndex] = attendanceRecord;
      } else {
        liveClass.attendance.push(attendanceRecord);
      }

      await liveClass.save();

      const results = {
        attendance: attendanceRecord,
        smsSent: false,
        smsError: null,
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          parentPhone: student.parentPhone
        },
        liveClass: {
          _id: liveClass._id,
          date: liveClass.date,
          startTime: liveClass.startTime,
          className: liveClass.class?.name
        }
      };

      // إرسال رسالة SMS للغياب
      if (sendSMS && student.parentPhone) {
        try {
          const cleanPhone = student.parentPhone.trim();
          let formattedPhone = cleanPhone;
          
          // تنسيق رقم الهاتف
          if (!formattedPhone.startsWith('+')) {
            if (formattedPhone.startsWith('0')) {
              formattedPhone = '+213' + formattedPhone.substring(1);
            } else {
              formattedPhone = '+213' + formattedPhone;
            }
          }

          // إنشاء نص الرسالة
          const smsMessage =  
          `غياب الطالب ${student.name}\n` +
          `الحصة: ${liveClass.class?.name || 'المدرسة'}\n` +
          `التاريخ: ${new Date(liveClass.date).toLocaleDateString('ar-EG')}\n` +
          `الرجاء التواصل مع الإدارة`;
    

          console.log(`📱 إرسال رسالة غياب إلى: ${formattedPhone}`);

          // إرسال الرسالة باستخدام Infobip
          const smsResult = await smsGateway.sendIndividualSMS(formattedPhone, smsMessage);

          if (smsResult.success) {
            results.smsSent = true;
            console.log(`✅ تم إرسال رسالة الغياب بنجاح`);

            // حفظ سجل الرسالة
            try {
              const messageRecord = new Message({
                sender: null,
                recipients: [{
                  student: student._id,
                  parentPhone: formattedPhone
                }],
                class: liveClass.class?._id,
                content: smsMessage,
                messageType: 'individual',
                status: 'sent'
              });
              await messageRecord.save({ validateBeforeSave: false });
            } catch (saveError) {
              console.error('⚠️ خطأ في حفظ سجل الرسالة:', saveError);
            }
          } else {
            results.smsSent = false;
            results.smsError = smsResult.error;
            console.error('❌ فشل إرسال رسالة الغياب:', smsResult.error);
          }
        } catch (smsError) {
          results.smsSent = false;
          results.smsError = smsError.message;
          console.error('❌ خطأ في إرسال SMS:', smsError);
        }
      }

      res.json({
        success: true,
        message: 'تم تسجيل غياب الطالب بنجاح' + (results.smsSent ? ' وإرسال رسالة لأولياء الأمور' : ''),
        data: results
      });

    } catch (err) {
      console.error('❌ خطأ في تسجيل الغياب:', err);
      res.status(500).json({
        success: false,
        error: err.message,
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  });
  app.post('/api/live-classes/:id/bulk-mark-absent', async (req, res) => {
    try {
      const liveClassId = req.params.id;
      const { studentIds, sendSMS = true, customMessage } = req.body;

      console.log(`📝 تسجيل غياب جماعي للحصة ${liveClassId} لـ ${studentIds?.length || 0} طالب`);

      if (!mongoose.Types.ObjectId.isValid(liveClassId)) {
        return res.status(400).json({
          success: false,
          error: 'معرف الحصة غير صالح'
        });
      }

      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'يجب توفير مصفوفة من معرفات الطلاب'
        });
      }

      const liveClass = await LiveClass.findById(liveClassId)
        .populate('class', 'name subject')
        .populate('teacher', 'name');

      if (!liveClass) {
        return res.status(404).json({
          success: false,
          error: 'الحصة الحية غير موجودة'
        });
      }

      const results = {
        total: studentIds.length,
        success: 0,
        failed: 0,
        details: []
      };

      // معالجة كل طالب
      for (const studentId of studentIds) {
        try {
          const student = await Student.findById(studentId);
          if (!student) {
            results.details.push({
              studentId,
              success: false,
              error: 'الطالب غير موجود'
            });
            results.failed++;
            continue;
          }

          // تحديث الحضور
          const existingIndex = liveClass.attendance.findIndex((a) =>
            a.student.toString() === student._id.toString()
          );

          const attendanceRecord = {
            student: student._id,
            status: 'absent',
            method: 'bulk',
            timestamp: new Date(),
            markedAsAbsent: true,
            markedAt: new Date()
          };

          if (existingIndex >= 0) {
            liveClass.attendance[existingIndex] = attendanceRecord;
          } else {
            liveClass.attendance.push(attendanceRecord);
          }

          let smsSent = false;
          let smsError = null;

          // إرسال SMS
          if (sendSMS && student.parentPhone) {
            try {
              const cleanPhone = student.parentPhone.trim();
              let formattedPhone = cleanPhone;
              
              if (!formattedPhone.startsWith('+')) {
                if (formattedPhone.startsWith('0')) {
                  formattedPhone = '+213' + formattedPhone.substring(1);
                } else {
                  formattedPhone = '+213' + formattedPhone;
                }
              }

              const smsMessage = customMessage || 
                `📚 إشعار غياب\n` +
                `عزيزي ولي أمر الطالب ${student.name}\n` +
                `يؤسفنا إعلامكم بأن الطالب غائب عن حصة ${liveClass.class?.name || 'المدرسة'}\n` +
                `📅 التاريخ: ${new Date(liveClass.date).toLocaleDateString('ar-EG')}\n` +
                `⏰ الوقت: ${liveClass.startTime}\n` +
                `👨‍🏫 المعلم: ${liveClass.teacher?.name || 'غير محدد'}\n` +
                `📞 نرجو التواصل مع الإدارة`;

              const smsResult = await smsGateway.sendIndividualSMS(formattedPhone, smsMessage);
              
              if (smsResult.success) {
                smsSent = true;
                
                // حفظ سجل الرسالة
                try {
                  const messageRecord = new Message({
                    sender: null,
                    recipients: [{
                      student: student._id,
                      parentPhone: formattedPhone
                    }],
                    class: liveClass.class?._id,
                    content: smsMessage,
                    messageType: 'individual',
                    status: 'sent'
                  });
                  await messageRecord.save({ validateBeforeSave: false });
                } catch (saveError) {
                  console.error('خطأ في حفظ سجل الرسالة:', saveError);
                }
              } else {
                smsError = smsResult.error;
              }
            } catch (smsError) {
              smsError = smsError.message;
            }
          }

          results.details.push({
            studentId,
            studentName: student.name,
            success: true,
            smsSent,
            smsError,
            parentPhone: student.parentPhone
          });
          results.success++;

        } catch (error) {
          results.details.push({
            studentId,
            success: false,
            error: error.message
          });
          results.failed++;
        }
      }

      // حفظ تحديثات الحضور
      await liveClass.save();

      res.json({
        success: true,
        message: `تم معالجة ${results.total} طالب - ${results.success} ناجح، ${results.failed} فاشل`,
        data: results
      });

    } catch (err) {
      console.error('❌ خطأ في تسجيل الغياب الجماعي:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });
  app.post('/api/live-classes/:id/auto-absent-all', async (req, res) => {
    try {
      const liveClassId = req.params.id;
      const { sendSMS = true, customMessage } = req.body;

      console.log(`🤖 تسجيل غياب تلقائي للحصة ${liveClassId}`);

      if (!mongoose.Types.ObjectId.isValid(liveClassId)) {
        return res.status(400).json({
          success: false,
          error: 'معرف الحصة غير صالح'
        });
      }

      const liveClass = await LiveClass.findById(liveClassId)
        .populate('class', 'name subject')
        .populate('teacher', 'name');

      if (!liveClass) {
        return res.status(404).json({
          success: false,
          error: 'الحصة الحية غير موجودة'
        });
      }

      // الحصول على جميع طلاب الحصة
      const classObj = await Class.findById(liveClass.class?._id)
        .populate('students');

      if (!classObj || !classObj.students || classObj.students.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'لا توجد طلاب مسجلين في هذه الحصة'
        });
      }

      const results = {
        totalStudents: classObj.students.length,
        markedAbsent: 0,
        smsSent: 0,
        smsFailed: 0,
        details: []
      };

      // تحديد الطلاب الحاضرين
      const presentStudentIds = new Set();
      liveClass.attendance.forEach(att => {
        if (att.status === 'present' || att.status === 'late') {
          presentStudentIds.add(att.student.toString());
        }
      });

      // تسجيل غياب جميع الطلاب غير الحاضرين
      for (const student of classObj.students) {
        const isPresent = presentStudentIds.has(student._id.toString());
        
        if (!isPresent) {
          try {
            // تحديث الحضور
            const existingIndex = liveClass.attendance.findIndex((a) =>
              a.student.toString() === student._id.toString()
            );

            const attendanceRecord = {
              student: student._id,
              status: 'absent',
              method: 'auto',
              timestamp: new Date(),
              markedAsAbsent: true,
              markedAt: new Date(),
              autoMarked: true
            };

            if (existingIndex >= 0) {
              liveClass.attendance[existingIndex] = attendanceRecord;
            } else {
              liveClass.attendance.push(attendanceRecord);
            }

            let smsSent = false;
            let smsError = null;

            // إرسال SMS
            if (sendSMS && student.parentPhone) {
              try {
                const cleanPhone = student.parentPhone.trim();
                let formattedPhone = cleanPhone;
                
                if (!formattedPhone.startsWith('+')) {
                  if (formattedPhone.startsWith('0')) {
                    formattedPhone = '+213' + formattedPhone.substring(1);
                  } else {
                    formattedPhone = '+213' + formattedPhone;
                  }
                }

                const smsMessage = customMessage || 
                  `📚 إشعار غياب\n` +
                  `عزيزي ولي أمر الطالب ${student.name}\n` +
                  `يؤسفنا إعلامكم بأن الطالب غائب عن حصة ${liveClass.class?.name || 'المدرسة'}\n` +
                  `📅 التاريخ: ${new Date(liveClass.date).toLocaleDateString('ar-EG')}\n` +
                  `⏰ الوقت: ${liveClass.startTime}\n` +
                  `👨‍🏫 المعلم: ${liveClass.teacher?.name || 'غير محدد'}\n` +
                  `📞 نرجو التواصل مع الإدارة`;

                const smsResult = await smsGateway.sendIndividualSMS(formattedPhone, smsMessage);
                
                if (smsResult.success) {
                  smsSent = true;
                  results.smsSent++;
                  
                  // حفظ سجل الرسالة
                  try {
                    const messageRecord = new Message({
                      sender: null,
                      recipients: [{
                        student: student._id,
                        parentPhone: formattedPhone
                      }],
                      class: liveClass.class?._id,
                      content: smsMessage,
                      messageType: 'individual',
                      status: 'sent'
                    });
                    await messageRecord.save({ validateBeforeSave: false });
                  } catch (saveError) {
                    console.error('خطأ في حفظ سجل الرسالة:', saveError);
                  }
                } else {
                  smsError = smsResult.error;
                  results.smsFailed++;
                }
              } catch (smsError) {
                smsError = smsError.message;
                results.smsFailed++;
              }
            }

            results.details.push({
              studentId: student._id,
              studentName: student.name,
              markedAbsent: true,
              smsSent,
              smsError,
              parentPhone: student.parentPhone
            });
            results.markedAbsent++;

          } catch (error) {
            results.details.push({
              studentId: student._id,
              studentName: student.name,
              markedAbsent: false,
              error: error.message
            });
          }
        }
      }

      // حفظ تحديثات الحضور
      await liveClass.save();

      res.json({
        success: true,
        message: `تم تسجيل ${results.markedAbsent} طالب كغائبين - ${results.smsSent} رسالة مرسلة`,
        data: results,
        summary: {
          totalStudents: results.totalStudents,
          present: classObj.students.length - results.markedAbsent,
          absent: results.markedAbsent,
          smsSuccess: results.smsSent,
          smsFailed: results.smsFailed
        }
      });

    } catch (err) {
      console.error('❌ خطأ في تسجيل الغياب التلقائي:', err);
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  });

  // نقطة نهاية لاختبار SMS مباشرة
  app.post('/api/test-sms-direct', async (req, res) => {
    try {
      const { phone, message } = req.body;
      
      console.log('🔬 === اختبار مباشر لـ SMS ===');
      console.log('📱 الرقم:', phone);
      console.log('📝 الرسالة:', message);
      
      if (!phone) {
        return res.status(400).json({ 
          success: false,
          error: 'يجب توفير رقم الهاتف' 
        });
      }
      
      // استخدام رسالة افتراضية
      const testMessage = message || '🔬 هذه رسالة اختبار مباشر من نظام Redox. يرجى التأكيد باستلامها.';
      
      console.log('📤 إرسال الطلب إلى smsGateway...');
      const result = await smsGateway.sendIndividualSMS(phone, testMessage);
      
      console.log('📥 نتيجة sendIndividualSMS:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        // تسجيل في قاعدة البيانات
        try {
          const testRecord = new Message({
            sender: req.user?.id || null,
            recipients: [{
              parentPhone: phone
            }],
            content: testMessage,
            messageType: 'test',
            status: 'sent'
          });
          
          await testRecord.save();
          console.log('✅ سجل الاختبار حفظ في قاعدة البيانات:', testRecord._id);
          
        } catch (dbError) {
          console.error('⚠️ خطأ في حفظ سجل الاختبار:', dbError.message);
        }
        
        res.json({
          success: true,
          message: '✅ تم إرسال SMS بنجاح في الاختبار المباشر',
          messageId: result.messageId,
          to: result.to,
          status: result.status,
          debug: {
            requestTime: new Date().toISOString(),
            gatewayResult: result
          }
        });
        
      } else {
        console.error('❌ فشل الاختبار المباشر:', result.error);
        
        res.status(500).json({
          success: false,
          error: '❌ فشل إرسال SMS في الاختبار المباشر',
          details: result.error,
          gatewayError: result.details,
          debug: {
            requestTime: new Date().toISOString(),
            gatewayResult: result
          }
        });
      }
      
    } catch (err) {
      console.error('💥 خطأ غير متوقع في اختبار SMS:', err);
      res.status(500).json({
        success: false,
        error: 'خطأ غير متوقع',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  });

  // نقطة نهاية لفحص حالة API Key
  app.get('/api/sms/check-api-key', async (req, res) => {
    try {
      console.log('🔑 التحقق من صحة API Key...');
      
      const testPayload = {
        messages: [{
          from: 'Redox',
          destinations: [{ to: '+213559581957' }], // رقم اختبار
          text: '🔑 اختبار API Key'
        }]
      };
      
      const testResponse = await axios.post(
        'https://3dvjnm.api.infobip.com/sms/2/text/advanced',
        testPayload,
        {
          headers: {
            'Authorization': 'App 54d821dd2a75bacd6e4bdbe5a020579a-19a2298b-a8f8-44bb-a624-53268d4aa47e',
            'Content-Type': 'application/json'
          }
        }
      );
      
      res.json({
        success: true,
        message: '✅ API Key صالح',
        response: testResponse.data
      });
      
    } catch (error) {
      console.error('❌ خطأ في API Key:', error.response?.data || error.message);
      
      res.status(500).json({
        success: false,
        error: '❌ مشكلة في API Key',
        details: error.response?.data || error.message,
        status: error.response?.status
      });
    }
  });
  app.post('/api/messages',  async (req, res) => {
    try {
      const { recipients, content, messageType, class: classId } = req.body;

      // Validate recipients based on message type
      let validatedRecipients = [];

      if (messageType === 'individual' && recipients.student) {
        const student = await Student.findById(recipients.student);
        if (!student) {
          return res.status(400).json({ error: 'الطالب غير موجود' });
        }
        validatedRecipients.push({
          student: student._id,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail
        });
      }
      else if (messageType === 'class' && classId) {
        const classObj = await Class.findById(classId).populate('students');
        if (!classObj) {
          return res.status(400).json({ error: 'الحصة غير موجودة' });
        }
        validatedRecipients = classObj.students.map(student => ({
          student: student._id,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail
        }));
      }
      else if (messageType === 'group' && recipients.length) {
        for (const recipient of recipients) {
          const student = await Student.findById(recipient.student);
          if (student) {
            validatedRecipients.push({
              student: student._id,
              parentPhone: student.parentPhone,
              parentEmail: student.parentEmail
            });
          }
        }
      }

      if (!validatedRecipients.length) {
        return res.status(400).json({ error: 'لا يوجد مستلمين للرسالة' });
      }

      // Send messages
      const failedRecipients = [];

      for (const recipient of validatedRecipients) {
        try {
          if (recipient.parentPhone) {
            await smsGateway.send(recipient.parentPhone, content);
          }
          if (recipient.parentEmail) {
            await transporter.sendMail({
              from: process.env.EMAIL_USER,
              to: recipient.parentEmail,
              subject: 'رسالة من المدرسة',
              text: content
            });
          }
        } catch (err) {
          console.error(`فشل إرسال الرسالة لـ ${recipient.parentPhone || recipient.parentEmail}`, err);
          failedRecipients.push(recipient);
        }
      }

      // Save message record
      const message = new Message({
        sender: req.user.id,
        recipients: validatedRecipients,
        class: classId,
        content,
        messageType,
        status: failedRecipients.length ? 'failed' : 'sent'
      });
      await message.save();

      if (failedRecipients.length) {
        return res.status(207).json({
          message: 'تم إرسال بعض الرسائل وفشل البعض الآخر',
          failedRecipients,
          messageId: message._id
        });
      }

      res.status(201).json({
        message: 'تم إرسال جميع الرسائل بنجاح',
        messageId: message._id
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

    // Student Registration Endpoint
    app.post('/api/student/register', async (req, res) => {
      try {
        console.log('Received registration data:', req.body);
    
        // Validate required fields
        const requiredFields = ['name', 'academicYear', 'parentName', 'parentPhone'];
        for (const field of requiredFields) {
          if (!req.body[field]) {
            return res.status(400).json({ 
              error: `حقل ${field} مطلوب` 
            });
          }
        }
    
        // Create student record
        const student = new Student({
          name: req.body.name,
          academicYear: req.body.academicYear,
          parentName: req.body.parentName,
          parentPhone: req.body.parentPhone,
          birthDate: req.body.birthDate,
          parentEmail: req.body.parentEmail,
          address: req.body.address,
          previousSchool: req.body.previousSchool,
          healthInfo: req.body.healthInfo,
          status: 'pending',
          active: false,
          hasPaidRegistration: false, // Default to not paid
          registrationDate: new Date(),
        });
    
        await student.save();
        
        // Create a pending school fee record
        const schoolFee = new SchoolFee({
          student: student._id,
          amount: 600, // 600 DZD
          status: 'pending'
        });
        await schoolFee.save();
        
        console.log('Student registered successfully:', student);
    
        res.status(201).json({
          message: 'تم استلام طلب التسجيل بنجاح',
          studentId: student._id
        });
      } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ 
          error: 'حدث خطأ أثناء تسجيل الطلب',
          details: err.message,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
      }
    });

    // Get Registration Requests (Admin only)
    app.get('/api/registration-requests',  async (req, res) => {
      try {
        const { status } = req.query;
        const query = { status: status || 'pending' };
        
        const requests = await Student.find(query)
          .sort({ registrationDate: -1 });
        
        res.json(requests);
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Approve Student
    app.put('/api/admin/approve-student/:id',  async (req, res) => {
      try {
        // Generate official student ID
        const year = new Date().getFullYear().toString().slice(-2);
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const studentId = `STU-${year}-${randomNum}`;

        const student = await Student.findByIdAndUpdate(
          req.params.id,
          {
            status: 'active',
            active: true,
            studentId,
            $unset: { 'registrationData.tempId': 1 }
          },
          { new: true }
        );

        // Send approval notification
        io.to(`student-${student.studentId}`).emit('registration-update', {
          studentId: student.studentId,
          status: 'active',
          name: student.name,
          registrationDate: student.registrationDate
        });

        res.json({
          message: 'تم تفعيل حساب الطالب بنجاح',
          studentId: student.studentId
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    // Reject Student
    app.put('/api/admin/reject-student/:id',  async (req, res) => {
      try {
        const { reason } = req.body;
        const student = await Student.findByIdAndUpdate(
          req.params.id,
          { status: 'inactive', active: false },
          { new: true }
        );

        io.to(`student-${student.studentId}`).emit('registration-update', {
          studentId: student.studentId,
          status: 'inactive',
          name: student.name,
          registrationDate: student.registrationDate,
          reason: req.body.reason
        });

        res.json({ message: 'تم رفض طلب التسجيل' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Add this endpoint
    app.post('/api/student/status', async (req, res) => {
      try {
        const { studentId, parentPhone } = req.body;
        const student = await Student.findOne({ 
          studentId,
          parentPhone 
        });

        if (!student) {
          return res.status(404).json({ error: 'لم يتم العثور على الطالب' });
        }

        // Subscribe client to updates for this student
        const socketId = req.headers['socket-id'];
        if (socketId && io.sockets.sockets[socketId]) {
          io.sockets.sockets[socketId].join(`student-${studentId}`);
        }

        res.json({
          name: student.name,
          studentId: student.studentId,
          status: student.status,
          registrationDate: student.registrationDate,
          academicYear: student.academicYear
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });



    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('subscribe-to-status', (studentId) => {
        socket.join(`student-${studentId}`);
        console.log(`Client subscribed to student ${studentId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    // create student account for ta3limi by user id 
    // req student id 

    // Add these routes to your backend (server.js or routes file)

    // Get all student accounts with filtering
    // Get all student accounts with filtering
    app.get('/api/student-accounts',  async (req, res) => {
    try {
      const { status, search } = req.query;
      const query = { role: 'student' };

      if (status) query.active = status === 'active';
      if (search) {
        query.$or = [
          { username: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } },
          { studentId: { $regex: search, $options: 'i' } }
        ];
      }

      const accounts = await StudentAccount.find(query)
        .select('-password')
        .populate('student', 'name studentId parentPhone parentEmail academicYear');

      res.json(accounts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    });
    // Create student account
    app.post('/api/student-accounts',  async (req, res) => {
      const { studentId, username, password, email } = req.body;

      try {
        // Validate required fields
        if (!studentId || !username || !password) {
          return res.status(400).json({ error: 'يجب إدخال جميع الحقول المطلوبة' });
        }

        // Check if student exists
        const student = await Student.findOne({ _id: studentId });
        if (!student) {
          return res.status(404).json({ error: 'الطالب غير موجود' });
        }

        // Check if account already exists
        const existingAccount = await StudentAccount.findOne({ 
          $or: [{ username }, { studentId: student.studentId }] 
        });
        
        if (existingAccount) {
          return res.status(400).json({ 
            error: 'اسم المستخدم أو حساب الطالب موجود بالفعل' 
          });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create account
        const newAccount = new StudentAccount({
          username,
          password: hashedPassword,
          fullName: student.name,
          studentId: student.studentId,
          student: student._id,
          email: email || student.parentEmail,
          role: 'student'
        });

        await newAccount.save();

        // Update student record to mark as having account
        student.hasAccount = true;
        await student.save();

        res.status(201).json({
          message: 'تم إنشاء حساب الطالب بنجاح',
          account: {
            _id: newAccount._id,
            username: newAccount.username,
            studentId: newAccount.studentId,
            studentName: student.name
          }
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
    // Delete student account
    app.delete('/api/student-accounts/:id',  async (req, res) => {
      try {
        const account = await StudentAccount.findByIdAndDelete(req.params.id);
        
        if (!account) {
          return res.status(404).json({ error: 'الحساب غير موجود' });
        }

        // Update student record to mark as no account
        await Student.updateOne(
          { studentId: account.studentId },
          { $set: { hasAccount: false } }
        );

        res.json({ message: 'تم حذف الحساب بنجاح' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Reset password
    app.put('/api/student-accounts/:id/reset-password',  async (req, res) => {
      const { password } = req.body;

      try {
        if (!password) {
          return res.status(400).json({ error: 'يجب إدخال كلمة مرور جديدة' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const account = await StudentAccount.findByIdAndUpdate(
          req.params.id,
          { password: hashedPassword },
          { new: true }
        ).select('-password');

        if (!account) {
          return res.status(404).json({ error: 'الحساب غير موجود' });
        }

        res.json({ 
          message: 'تم تحديث كلمة المرور بنجاح',
          account
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Toggle account status (active/inactive)
    app.put('/api/student-accounts/:id/toggle-status',  async (req, res) => {
      try {
        const account = await StudentAccount.findById(req.params.id);
        
        if (!account) {
          return res.status(404).json({ error: 'الحساب غير موجود' });
        }

        account.active = !account.active;
        await account.save();

        res.json({ 
          message: `تم ${account.active ? 'تفعيل' : 'تعطيل'} الحساب بنجاح`,
          account
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Student Login Route
    app.post('/api/student/login', async (req, res) => {
      try {
        const { username, password } = req.body;
        const studentAccount = await StudentAccount.findOne({ username });

        if (!studentAccount || !(await bcrypt.compare(password, studentAccount.password))) {
          return res.status(401).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        }

// في نقطة /api/auth/login
const token = jwt.sign(
    {
        id: admin._id,
        username: admin.username,
        role: admin.role,
        schoolId: school._id, // ✅ تم إضافة schoolId هنا
        schoolKey: school.schoolKey,
        permissions: admin.permissions
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '8h' }
);

        res.json({ 
          token, 
          user: { 
            username: studentAccount.username,
            role: studentAccount.role,
            fullName: studentAccount.fullName,
            studentId: studentAccount.studentId
          } 
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Get Student Data
    app.get('/api/student/data', async (req, res) => {
      try {
        const student = await Student.findOne({ studentId: req.user.studentId })
          .populate({
            path: 'classes',
            populate: [
              { path: 'teacher', model: 'Teacher' },
              { path: 'schedule.classroom', model: 'Classroom' }
            ]
          });

        if (!student) {
          return res.status(404).json({ error: 'الطالب غير موجود' });
        }

        // Get upcoming classes (next 7 days)
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const upcomingClasses = [];
        const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        
        student.classes.forEach(cls => {
          cls.schedule.forEach(session => {
            const dayIndex = days.indexOf(session.day);
            if (dayIndex >= 0) {
              const classDate = new Date(today);
              const daysToAdd = (dayIndex - today.getDay() + 7) % 7;
              classDate.setDate(today.getDate() + daysToAdd);
              
              if (classDate >= today && classDate <= nextWeek) {
                const [hours, minutes] = session.time.split(':').map(Number);
                classDate.setHours(hours, minutes, 0, 0);
                
                upcomingClasses.push({
                  classId: cls._id,
                  className: cls.name,
                  subject: cls.subject,
                  teacher: cls.teacher.name,
                  day: session.day,
                  time: session.time,
                  classroom: session.classroom?.name || 'غير محدد',
                  date: classDate,
                  formattedDate: classDate.toLocaleDateString('ar-EG')
                });
              }
            }
          });
        });

        // Sort by date
        upcomingClasses.sort((a, b) => a.date - b.date);

        // Get payment status
        const payments = await Payment.find({ 
          student: student._id 
        }).populate('class').sort({ month: -1 });

        res.json({
          student: {
            name: student.name,
            studentId: student.studentId,
            academicYear: student.academicYear,
            parentName: student.parentName,
            parentPhone: student.parentPhone,
            parentEmail: student.parentEmail
          },
          upcomingClasses,
          payments
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });

    // Student Change Password
    app.post('/api/student/change-password',  async (req, res) => {
      try {
        const { currentPassword, newPassword } = req.body;
        const studentAccount = await StudentAccount.findById(req.user.id);

        if (!(await bcrypt.compare(currentPassword, studentAccount.password))) {
          return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة' });
        }

        studentAccount.password = await bcrypt.hash(newPassword, 10);
        await studentAccount.save();

        res.json({ message: 'تم تغيير كلمة المرور بنجاح' });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });
// ==============================================
// نقطة نهاية عامة لتسجيل الحضور عبر البطاقة (بدون مصادقة)
// ==============================================
// في server.js - أضف هذا الكود قبل أي middleware للمصادقة
// ==============================================
// نقطة نهاية عامة لتسجيل الحضور عبر البطاقة (بدون مصادقة)
// ==============================================
// ==============================================
// نقطة نهاية تسجيل الحضور عبر البطاقة (تعمل بدون مصادقة)
// ==============================================
// ==============================================
// نقطة نهاية لتسجيل غياب الطالب في الحصة الجارية
// ==============================================
// ==============================================
// نقطة نهاية تسجيل حضور الطالب في الحصة الحية
// ==============================================
// ==============================================
// ✅ نقطة نهاية محسنة لمسح البطاقة - مع التحقق من الدفعات المتأخرة
// ==============================================
// ==============================================
// ✅ نقطة نهاية محسنة لمسح البطاقة - مع التحقق من الدفعات المتأخرة ورسوم التسجيل
// ==============================================
// ==============================================
// ✅ نقطة نهاية محسنة لمسح البطاقة - مع التحقق من الدفعات المتأخرة ورسوم التسجيل
// ==============================================
// ==============================================
// ✅ نقطة نهاية محسنة لمسح البطاقة - مع التحقق من الدفعات المتأخرة ورسوم التسجيل
// ==============================================
// ==============================================
// ✅ نقطة نهاية محسنة لمسح البطاقة - مع التحقق من الدفعات المتأخرة ورسوم التسجيل



// ==============================================
app.post('/api/attendance/card-scan-enhanced', async (req, res) => {
  try {
    const { cardUid, sendSMS = false, checkPayments = true, checkRegistration = true } = req.body;
    
    console.log('🔍 [محسّن] معالجة البطاقة:', cardUid);
    console.log('📋 التحقق من الدفعات:', checkPayments);
    console.log('📋 التحقق من رسوم التسجيل:', checkRegistration);
    
    if (!cardUid) {
      return res.status(400).json({
        success: false,
        error: 'رقم البطاقة مطلوب'
      });
    }

    // 1. البحث عن البطاقة والطالب
    const card = await Card.findOne({ uid: cardUid })
      .populate({
        path: 'student',
        populate: [
          { path: 'classes', select: 'name subject' },
          { path: 'schoolId', select: 'name schoolKey' }
        ]
      });
    
    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'البطاقة غير مسجلة في النظام'
      });
    }

    const student = card.student;
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'الطالب غير موجود'
      });
    }

    console.log(`✅ الطالب: ${student.name} (${student.studentId})`);
    console.log(`🔍 hasPaidRegistration: ${student.hasPaidRegistration}`);

    // 2. التحقق من الدفعات المتأخرة - 🔥 البحث عن جميع الدفعات غير المدفوعة
    let overduePayments = [];
    let registrationStatus = null;
    let currentClass = null;
    let attendanceStatus = null;
    let hasOverdue = false;
    let hasRegistrationIssue = false;
    let totalOverdueAmount = 0;

    const currentMonth = new Date().toISOString().slice(0, 7);
    console.log(`📅 الشهر الحالي: ${currentMonth}`);

    // البحث عن الحصة الحية والدفعات المتأخرة بالتوازي
    const [liveClasses, allStudentPayments, registrationFee] = await Promise.all([
      // البحث عن حصة حية جارية
      LiveClass.find({
        status: 'ongoing'
      }).populate({
        path: 'class',
        populate: { path: 'students', model: 'Student' }
      }).populate('teacher', 'name'),
      
      // 🔥 البحث عن جميع دفعات الطالب
      Payment.find({
        student: student._id
      }).populate('class', 'name subject').sort({ monthCode: 1 }),
      
      // التحقق من رسوم التسجيل
      checkRegistration ? SchoolFee.findOne({
        student: student._id,
        status: 'paid'
      }) : null
    ]);

    console.log(`📊 عدد الدفعات الكلي للطالب: ${allStudentPayments.length}`);
    
    // 🔥 تصفية الدفعات المتأخرة (غير المدفوعة)
    overduePayments = allStudentPayments.filter(p => {
      // الدفعة غير مدفوعة (الحالة pending أو late)
      const isUnpaid = p.status === 'pending' || p.status === 'late';
      
      // إذا كانت الدفعة غير مدفوعة ولديها شهر محدد
      if (isUnpaid && p.monthCode) {
        // إذا كان الشهر أقل من الشهر الحالي (أي متأخر)
        if (p.monthCode < currentMonth) {
          return true;
        }
        // إذا كان الشهر الحالي ولكن متأخر (أي لم يدفع في الوقت المناسب)
        if (p.monthCode === currentMonth) {
          return true;
        }
      }
      return false;
    });

    hasOverdue = overduePayments.length > 0;
    totalOverdueAmount = overduePayments.reduce((sum, p) => sum + p.amount, 0);
    
    console.log(`⚠️ عدد الدفعات المتأخرة: ${overduePayments.length}`);
    console.log(`⚠️ إجمالي المبلغ المتأخر: ${totalOverdueAmount} د.ج`);
    console.log(`⚠️ hasOverdue: ${hasOverdue}`);
    
    // عرض تفاصيل الدفعات المتأخرة
    overduePayments.forEach(p => {
      console.log(`   - ${p.month || p.monthCode}: ${p.amount} د.ج (${p.status})`);
    });

    // 3. التحقق من رسوم التسجيل
    if (checkRegistration) {
      registrationStatus = registrationFee ? 'paid' : 'pending';
      hasRegistrationIssue = registrationStatus === 'pending';
      console.log(`📋 حالة رسوم التسجيل: ${registrationStatus}`);
      console.log(`📋 hasRegistrationIssue: ${hasRegistrationIssue}`);
    }

    // البحث عن الحصة الحية للطالب
    for (const liveClass of liveClasses) {
      const classObj = liveClass.class;
      if (classObj && classObj.students) {
        const isEnrolled = classObj.students.some(
          s => s._id.toString() === student._id.toString()
        );
        if (isEnrolled) {
          currentClass = {
            _id: classObj._id,
            name: classObj.name,
            subject: classObj.subject,
            teacher: liveClass.teacher
          };
          
          // تسجيل الحضور
          const now = new Date();
          const attendanceIndex = liveClass.attendance.findIndex(
            att => att.student.toString() === student._id.toString()
          );
          
          let status = 'present';
          if (liveClass.startTime) {
            const [classHour, classMinute] = liveClass.startTime.split(':').map(Number);
            const classStartMinutes = classHour * 60 + classMinute;
            const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
            if (currentTimeMinutes > classStartMinutes + 15) {
              status = 'late';
            }
          }
          
          if (attendanceIndex >= 0) {
            liveClass.attendance[attendanceIndex].status = status;
            liveClass.attendance[attendanceIndex].joinedAt = now;
          } else {
            liveClass.attendance.push({
              student: student._id,
              status: status,
              joinedAt: now,
              leftAt: null
            });
          }
          
          await liveClass.save();
          attendanceStatus = { status, time: now };
          break;
        }
      }
    }

    // 4. إرسال رسالة SMS (اختياري)
    let smsSent = false;
    if (sendSMS && student.parentPhone) {
      try {
        smsSent = true;
      } catch (err) {
        console.error('❌ فشل إرسال SMS:', err);
      }
    }

    // 5. إرجاع الاستجابة مع جميع البيانات
    const hasIssues = hasOverdue || hasRegistrationIssue;

    console.log(`📊 النتيجة النهائية:`);
    console.log(`   hasOverdue: ${hasOverdue}`);
    console.log(`   hasRegistrationIssue: ${hasRegistrationIssue}`);
    console.log(`   hasIssues: ${hasIssues}`);

    res.json({
      success: true,
      message: hasIssues
        ? `تم تسجيل حضور الطالب ${student.name} مع وجود ${hasOverdue ? overduePayments.length + ' دفعة متأخرة' : ''}${hasOverdue && hasRegistrationIssue ? ' و' : ''}${hasRegistrationIssue ? 'رسوم تسجيل غير مدفوعة' : ''}`
        : `تم تسجيل حضور الطالب ${student.name} بنجاح`,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          academicYear: student.academicYear,
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail,
          active: student.active,
          status: student.status,
          hasPaidRegistration: student.hasPaidRegistration || false
        },
        class: currentClass,
        attendance: attendanceStatus,
        overduePayments: overduePayments.map(p => ({
          _id: p._id,
          amount: p.amount,
          month: p.month || p.monthCode,
          monthCode: p.monthCode,
          class: p.class,
          status: p.status
        })),
        registrationStatus: registrationStatus,
        hasOverdue: hasOverdue,
        hasRegistrationIssue: hasRegistrationIssue,
        hasIssues: hasIssues,
        totalOverdueAmount: totalOverdueAmount,
        sms: { sent: smsSent },
        timestamp: new Date()
      }
    });

  } catch (err) {
    console.error('❌ خطأ في نقطة card-scan-enhanced:', err);
    res.status(500).json({ 
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});
// ==============================================
// ✅ نقطة نهاية للتحقق من حالة الطالب (مدفوعات ورسوم تسجيل)
// ==============================================
app.get('/api/students/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const schoolId = req.query.schoolId || req.user?.schoolId;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الطالب غير صالح'
      });
    }

    const student = await Student.findOne({
      _id: id,
      ...(schoolId && { schoolId: schoolId })
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'الطالب غير موجود'
      });
    }

    // التحقق من الدفعات المتأخرة
    const overduePayments = await Payment.find({
      student: student._id,
      status: { $in: ['pending', 'late'] },
      monthCode: { $lt: new Date().toISOString().slice(0, 7) }
    }).populate('class', 'name subject').sort({ monthCode: 1 });

    // التحقق من رسوم التسجيل
    const registrationFee = await SchoolFee.findOne({
      student: student._id,
      status: 'paid'
    });

    const registrationStatus = registrationFee ? 'paid' : 'pending';
    
    // الحصول على الحصص النشطة للطالب
    const activeClasses = await Class.find({
      _id: { $in: student.classes || [] },
      ...(schoolId && { schoolId: schoolId })
    }).populate('teacher', 'name').populate('schedule.classroom', 'name');

    res.json({
      success: true,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          academicYear: student.academicYear,
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          hasPaidRegistration: student.hasPaidRegistration || false,
          active: student.active,
          status: student.status
        },
        overduePayments: overduePayments.map(p => ({
          _id: p._id,
          amount: p.amount,
          month: p.month,
          monthCode: p.monthCode,
          class: p.class
        })),
        registrationStatus: registrationStatus,
        activeClasses: activeClasses.map(c => ({
          _id: c._id,
          name: c.name,
          subject: c.subject,
          teacher: c.teacher?.name,
          price: c.price
        })),
        hasIssues: overduePayments.length > 0 || registrationStatus === 'pending'
      }
    });

  } catch (err) {
    console.error('❌ خطأ في جلب حالة الطالب:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
// ==============================================
// ✅ نقطة نهاية لتسجيل دفع رسوم التسجيل (مع التحقق من المدرسة)
// ==============================================
app.post('/api/students/:id/pay-registration-enhanced', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, paymentDate, notes } = req.body;
    const schoolId = req.query.schoolId || req.body.schoolId || req.user?.schoolId;
    
    console.log(`💰 تسجيل دفع رسوم التسجيل للطالب: ${id}`);
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    const student = await Student.findOne({
      _id: id,
      schoolId: schoolId
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'الطالب غير موجود أو لا ينتمي للمدرسة'
      });
    }

    // التحقق من الدفع المسبق
    if (student.hasPaidRegistration) {
      return res.status(400).json({
        success: false,
        error: 'رسوم التسجيل مدفوعة مسبقاً لهذا الطالب'
      });
    }

    // تحديث حالة الطالب
    student.hasPaidRegistration = true;
    student.status = 'active';
    student.active = true;
    await student.save();

    // إنشاء سجل رسوم التسجيل
    const registrationFee = new SchoolFee({
      schoolId: schoolId,
      student: student._id,
      amount: amount || 600,
      paymentDate: paymentDate || new Date(),
      paymentMethod: paymentMethod || 'cash',
      status: 'paid',
      invoiceNumber: `REG-${Date.now().toString().slice(-8)}`,
      recordedBy: req.user?.id || null,
      notes: notes || 'دفع رسوم التسجيل'
    });
    await registrationFee.save();

    // تسجيل المعاملة المالية
    const transaction = new FinancialTransaction({
      schoolId: schoolId,
      type: 'income',
      amount: amount || 600,
      description: `رسوم تسجيل الطالب ${student.name}`,
      category: 'registration',
      date: registrationFee.paymentDate,
      recordedBy: req.user?.id || null,
      reference: registrationFee._id,
      student: student._id
    });
    await transaction.save();

    console.log(`✅ تم تسجيل دفع رسوم التسجيل للطالب ${student.name}`);

    res.json({
      success: true,
      message: 'تم تسجيل دفع رسوم التسجيل بنجاح',
      data: {
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          hasPaidRegistration: student.hasPaidRegistration
        },
        receiptNumber: registrationFee.invoiceNumber,
        transactionId: transaction._id,
        amount: registrationFee.amount,
        paymentDate: registrationFee.paymentDate
      }
    });

  } catch (err) {
    console.error('❌ خطأ في تسجيل دفع رسوم التسجيل:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
// ==============================================
// ✅ نقطة نهاية للحصول على إحصائيات الدفعات المتأخرة للمدرسة
// ==============================================
app.get('/api/accounting/overdue-summary', async (req, res) => {
  try {
    const { schoolId, month } = req.query;
    
    if (!schoolId) {
      return res.status(400).json({
        success: false,
        error: 'يجب تحديد المدرسة (schoolId)'
      });
    }

    // بناء فلتر الدفعات المتأخرة
    const filter = {
      schoolId: schoolId,
      status: { $in: ['pending', 'late'] }
    };

    if (month) {
      filter.monthCode = { $lt: month };
    } else {
      filter.monthCode = { $lt: new Date().toISOString().slice(0, 7) };
    }

    // جلب الدفعات المتأخرة
    const overduePayments = await Payment.find(filter)
      .populate('student', 'name studentId parentPhone')
      .populate('class', 'name subject')
      .sort({ monthCode: 1 });

    // تجميع حسب الطالب
    const studentMap = {};
    overduePayments.forEach(p => {
      const studentId = p.student?._id?.toString() || 'unknown';
      if (!studentMap[studentId]) {
        studentMap[studentId] = {
          student: p.student,
          totalAmount: 0,
          count: 0,
          payments: []
        };
      }
      studentMap[studentId].totalAmount += p.amount;
      studentMap[studentId].count++;
      studentMap[studentId].payments.push({
        _id: p._id,
        amount: p.amount,
        month: p.month,
        monthCode: p.monthCode,
        class: p.class,
        status: p.status
      });
    });

    // تحويل إلى مصفوفة وترتيب حسب المبلغ
    const studentsOverdue = Object.values(studentMap)
      .filter(item => item.student)
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // إحصائيات عامة
    const summary = {
      totalStudents: studentsOverdue.length,
      totalAmount: studentsOverdue.reduce((sum, s) => sum + s.totalAmount, 0),
      totalPayments: overduePayments.length,
      averagePerStudent: studentsOverdue.length > 0 
        ? Math.round(studentsOverdue.reduce((sum, s) => sum + s.totalAmount, 0) / studentsOverdue.length)
        : 0,
      mostOverdueStudent: studentsOverdue[0]?.student || null,
      mostOverdueAmount: studentsOverdue[0]?.totalAmount || 0
    };

    // التحقق من رسوم التسجيل غير المدفوعة
    const pendingRegistration = await SchoolFee.find({
      schoolId: schoolId,
      status: 'pending'
    }).populate('student', 'name studentId parentPhone');

    const registrationSummary = {
      count: pendingRegistration.length,
      students: pendingRegistration.map(f => ({
        student: f.student,
        amount: f.amount,
        createdAt: f.createdAt
      }))
    };

    res.json({
      success: true,
      summary: summary,
      studentsOverdue: studentsOverdue,
      registrationPending: registrationSummary,
      month: month || new Date().toISOString().slice(0, 7),
      totalIssues: studentsOverdue.length + pendingRegistration.length
    });

  } catch (err) {
    console.error('❌ خطأ في جلب إحصائيات الدفعات المتأخرة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
// ==============================================
// ✅ تحديث حالة الدفعة للطالب (مع دعم واتساب)
// ==============================================
app.put('/api/payments/:id/update-status', async (req, res) => {
  try {
    const paymentId = req.params.id;
    const { 
      status, 
      paymentMethod, 
      paymentDate, 
      notes, 
      schoolId,
      sendWhatsApp = false 
    } = req.body;
    
    console.log(`📝 تحديث حالة الدفعة: ${paymentId}`);
    console.log(`📊 الحالة الجديدة: ${status}`);
    console.log(`📱 إرسال واتساب: ${sendWhatsApp}`);
    
    // التحقق من صحة المعرف
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الدفعة غير صالح'
      });
    }
    
    // جلب الدفعة مع البيانات المرتبطة
    const payment = await Payment.findById(paymentId)
      .populate('student', 'name studentId parentPhone parentName schoolId')
      .populate('class', 'name subject price');
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'الدفعة غير موجودة'
      });
    }
    
    // التحقق من صلاحية المدرسة
    if (schoolId && payment.schoolId?.toString() !== schoolId.toString()) {
      return res.status(403).json({
        success: false,
        error: 'غير مصرح بالوصول لهذه الدفعة'
      });
    }
    
    // حفظ الحالة القديمة
    const oldStatus = payment.status;
    
    // تحديث بيانات الدفعة
    payment.status = status;
    
    if (status === 'paid') {
      payment.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
      payment.paymentMethod = paymentMethod || payment.paymentMethod || 'cash';
      payment.invoiceNumber = payment.invoiceNumber || `INV-${Date.now().toString().slice(-8)}`;
    } else if (status === 'pending' || status === 'late') {
      // إلغاء تاريخ الدفع إذا كانت الحالة معلقة أو متأخرة
      if (oldStatus === 'paid') {
        payment.paymentDate = null;
        payment.invoiceNumber = null;
      }
    }
    
    if (notes) {
      payment.notes = payment.notes 
        ? `${payment.notes} | ${notes}` 
        : notes;
    }
    
    await payment.save();
    console.log(`✅ تم تحديث حالة الدفعة من ${oldStatus} إلى ${status}`);
    
    // ==============================================
    // تحديث العمولة المرتبطة (إذا وجدت)
    // ==============================================
    let commissionUpdated = false;
    
    if (payment.commissionId) {
      const commission = await TeacherCommission.findById(payment.commissionId);
      
      if (commission) {
        const studentIndex = commission.students.findIndex(
          s => s.student.toString() === payment.student._id.toString()
        );
        
        if (studentIndex !== -1) {
          if (status === 'paid') {
            commission.students[studentIndex].status = 'paid';
            commission.students[studentIndex].paymentDate = payment.paymentDate;
            commission.students[studentIndex].paymentMethod = payment.paymentMethod;
            commission.students[studentIndex].receiptNumber = payment.invoiceNumber;
            
            const studentShare = commission.students[studentIndex].teacherShare || 0;
            commission.totalPaid += studentShare;
            commission.remainingAmount = commission.totalAmount - commission.totalPaid;
            
            if (commission.remainingAmount <= 0) {
              commission.status = 'paid';
            } else if (commission.totalPaid > 0) {
              commission.status = 'partial';
            }
            
            commissionUpdated = true;
          } else if (status === 'cancelled' || status === 'pending') {
            // إذا تم إلغاء الدفعة، نقوم بتحديث العمولة
            commission.students[studentIndex].status = 'pending';
            commission.students[studentIndex].paymentDate = null;
            commission.students[studentIndex].paymentMethod = null;
            commission.students[studentIndex].receiptNumber = null;
            
            const studentShare = commission.students[studentIndex].teacherShare || 0;
            commission.totalPaid = Math.max(0, commission.totalPaid - studentShare);
            commission.remainingAmount = commission.totalAmount - commission.totalPaid;
            
            if (commission.remainingAmount <= 0) {
              commission.status = 'paid';
            } else if (commission.totalPaid > 0) {
              commission.status = 'partial';
            } else {
              commission.status = 'pending';
            }
            
            commissionUpdated = true;
          }
          
          if (commissionUpdated) {
            await commission.save();
            console.log(`✅ تم تحديث العمولة المرتبطة: ${commission._id}`);
          }
        }
      }
    }
    
    // ==============================================
    // تحديث المعاملة المالية (إذا كانت مدفوعة)
    // ==============================================
    if (status === 'paid' && oldStatus !== 'paid') {
      // إنشاء معاملة مالية جديدة
      const transaction = new FinancialTransaction({
        schoolId: payment.schoolId,
        type: 'income',
        amount: payment.amount,
        description: `دفعة من الطالب ${payment.student?.name || 'غير معروف'} - ${payment.month || 'شهر غير محدد'}`,
        category: 'tuition',
        recordedBy: req.user?.id || null,
        reference: payment._id,
        student: payment.student?._id,
        date: payment.paymentDate || new Date()
      });
      await transaction.save();
      console.log(`✅ تم إنشاء معاملة مالية جديدة: ${transaction._id}`);
      
    } else if (status !== 'paid' && oldStatus === 'paid') {
      // إذا تم تغيير الحالة من مدفوع إلى غير مدفوع، حذف المعاملة المالية
      await FinancialTransaction.deleteMany({
        reference: payment._id,
        type: 'income'
      });
      console.log(`🗑️ تم حذف المعاملة المالية المرتبطة`);
    }
    
    // ==============================================
    // إرسال رسالة واتساب (إذا كان مطلوباً)
    // ==============================================
    let whatsappSent = false;
    let whatsappError = null;
    
    if (sendWhatsApp && payment.student) {
      try {
        const student = payment.student;
        const parentPhone = student.parentPhone;
        
        if (parentPhone) {
          // تنسيق رقم الهاتف
          let cleanPhone = parentPhone.trim();
          if (!cleanPhone.startsWith('+')) {
            if (cleanPhone.startsWith('0')) {
              cleanPhone = '+213' + cleanPhone.substring(1);
            } else {
              cleanPhone = '+213' + cleanPhone;
            }
          }
          
          // إنشاء نص الرسالة حسب الحالة
          let message = '';
          const studentName = student.name;
          const className = payment.class?.name || 'الحصة';
          const amount = payment.amount.toLocaleString();
          const month = payment.month || 'الشهر الحالي';
          
          switch (status) {
            case 'paid':
              message = 
                `📢 إشعار دفع\n` +
                `عزيزي ولي أمر الطالب ${studentName}\n` +
                `تم تسجيل دفع مبلغ ${amount} د.ج عن شهر ${month} لحصة ${className}\n` +
                `📅 تاريخ الدفع: ${new Date(payment.paymentDate || new Date()).toLocaleDateString('ar-EG')}\n` +
                `💳 طريقة الدفع: ${paymentMethod || 'نقداً'}\n` +
                `شكراً لثقتكم بنا 🌟`;
              break;
              
            case 'late':
              message = 
                `⚠️ تنبيه دفع متأخر\n` +
                `عزيزي ولي أمر الطالب ${studentName}\n` +
                `نود التنبيه بأن دفعة شهر ${month} لحصة ${className} بقيمة ${amount} د.ج متأخرة\n` +
                `يرجى التوجه لإدارة المدرسة لتسوية الدفعة في أقرب وقت\n` +
                `شكراً لتعاونكم 🙏`;
              break;
              
            case 'pending':
              message = 
                `📋 إشعار دفع معلق\n` +
                `عزيزي ولي أمر الطالب ${studentName}\n` +
                `دفعة شهر ${month} لحصة ${className} بقيمة ${amount} د.ج ما زالت معلقة\n` +
                `يرجى التوجه لإدارة المدرسة لإتمام عملية الدفع\n` +
                `شكراً لتعاونكم 🙏`;
              break;
              
            case 'cancelled':
              message = 
                `📋 إشعار إلغاء دفع\n` +
                `عزيزي ولي أمر الطالب ${studentName}\n` +
                `تم إلغاء دفعة شهر ${month} لحصة ${className} بقيمة ${amount} د.ج\n` +
                `للاستفسار، يرجى التواصل مع إدارة المدرسة 📞`;
              break;
              
            default:
              message = 
                `📋 تحديث حالة الدفع\n` +
                `عزيزي ولي أمر الطالب ${studentName}\n` +
                `تم تحديث حالة دفعة شهر ${month} لحصة ${className} إلى ${status}\n` +
                `للاستفسار، يرجى التواصل مع إدارة المدرسة 📞`;
          }
          
          // إرسال الرسالة عبر واتساب
          const whatsappResult = await sendWhatsAppMessage(cleanPhone, message);
          
          if (whatsappResult.success) {
            whatsappSent = true;
            console.log(`✅ تم إرسال رسالة واتساب إلى ${cleanPhone}`);
            
            // حفظ سجل الرسالة
            const messageRecord = new Message({
              sender: req.user?.id || null,
              recipients: [{
                student: student._id,
                parentPhone: cleanPhone
              }],
              class: payment.class?._id,
              content: message,
              messageType: 'individual',
              status: 'sent'
            });
            await messageRecord.save({ validateBeforeSave: false });
            
          } else {
            whatsappError = whatsappResult.error;
            console.error(`❌ فشل إرسال واتساب: ${whatsappError}`);
          }
        } else {
          whatsappError = 'رقم الهاتف غير متوفر';
          console.warn('⚠️ رقم هاتف ولي الأمر غير متوفر');
        }
      } catch (err) {
        whatsappError = err.message;
        console.error('❌ خطأ في إرسال واتساب:', err);
      }
    }
    
    // ==============================================
    // إرجاع الاستجابة
    // ==============================================
    const updatedPayment = await Payment.findById(paymentId)
      .populate('student', 'name studentId parentPhone')
      .populate('class', 'name subject')
      .populate('recordedBy', 'username fullName');
    
    res.json({
      success: true,
      message: `تم تحديث حالة الدفعة إلى ${status} بنجاح`,
      data: {
        payment: updatedPayment,
        oldStatus: oldStatus,
        newStatus: status,
        commissionUpdated: commissionUpdated,
        whatsapp: {
          sent: whatsappSent,
          error: whatsappError
        }
      }
    });
    
  } catch (err) {
    console.error('❌ خطأ في تحديث حالة الدفعة:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ==============================================
// دالة مساعدة لإرسال رسائل واتساب
// ==============================================
async function sendWhatsAppMessage(phone, message) {
  try {
    // استخدام خدمة واتساب الموجودة لديك
    // هنا يمكنك استخدام Twilio, Meta API, أو أي خدمة أخرى
    
    // مثال باستخدام خدمة وهمية (استبدلها بخدمتك الفعلية)
    const response = await axios.post(
      `${process.env.WHATSAPP_API_URL}/send`,
      {
        phone: phone,
        message: message,
        apiKey: process.env.WHATSAPP_API_KEY
      }
    );
    
    if (response.data?.success) {
      return { success: true };
    } else {
      return { success: false, error: response.data?.error || 'فشل إرسال الرسالة' };
    }
    
  } catch (err) {
    console.error('❌ خطأ في sendWhatsAppMessage:', err);
    return { 
      success: false, 
      error: err.message || 'خطأ في الاتصال بخدمة واتساب' 
    };
  }
}


app.post('/api/attendance/card-scan', async (req, res) => {
  try {
    const { cardUid, sendSMS = true } = req.body;
    
    console.log('🔍 معالجة البطاقة:', cardUid);
    
    if (!cardUid) {
      return res.status(400).json({
        success: false,
        error: 'رقم البطاقة مطلوب'
      });
    }

    // 1. البحث عن البطاقة والطالب
    const card = await Card.findOne({ uid: cardUid }).populate('student');
    
    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'البطاقة غير مسجلة في النظام'
      });
    }

    const student = card.student;
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'الطالب غير موجود'
      });
    }

    console.log(`✅ الطالب: ${student.name} (${student.studentId})`);

    // 2. البحث عن حصة حية (LiveClass) جارية الآن
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    
    console.log(`⏰ الوقت الحالي: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);

    // البحث عن جميع الحصص الحية التي حالتها "جارية" (ongoing)
    const ongoingLiveClasses = await LiveClass.find({
      status: 'ongoing'
    }).populate({
      path: 'class',
      populate: {
        path: 'students',
        model: 'Student'
      }
    }).populate('teacher', 'name');

    console.log(`📚 عدد الحصص الحية الجارية: ${ongoingLiveClasses.length}`);

    if (ongoingLiveClasses.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'لا توجد حصص حية جارية حالياً',
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId
        }
      });
    }

    // 3. البحث عن حصة حية يشارك فيها الطالب
    let targetLiveClass = null;
    
    for (const liveClass of ongoingLiveClasses) {
      // التحقق مما إذا كان الطالب مسجلاً في هذه الحصة
      const classObj = liveClass.class;
      if (classObj && classObj.students) {
        const isStudentEnrolled = classObj.students.some(
          s => s._id.toString() === student._id.toString()
        );
        
        if (isStudentEnrolled) {
          targetLiveClass = liveClass;
          console.log(`✅ تم العثور على حصة حية للطالب: ${classObj.name}`);
          break;
        }
      }
    }

    if (!targetLiveClass) {
      console.log(`❌ لا توجد حصة حية جارية مسجل فيها الطالب ${student.name}`);
      return res.status(404).json({
        success: false,
        error: 'لا توجد حصة حية جارية مسجل فيها الطالب',
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId
        },
        ongoingClassesCount: ongoingLiveClasses.length,
        ongoingClasses: ongoingLiveClasses.map(lc => ({
          name: lc.class?.name,
          startTime: lc.startTime,
          status: lc.status
        }))
      });
    }

    console.log(`✅ الحصة المستهدفة: ${targetLiveClass.class.name} (${targetLiveClass.startTime})`);

    // 4. تسجيل حضور الطالب
    const attendanceIndex = targetLiveClass.attendance.findIndex(
      att => att.student.toString() === student._id.toString()
    );

    // تحديد حالة الحضور (حاضر أو متأخر)
    let attendanceStatus = 'present';
    if (targetLiveClass.startTime) {
      const [classHour, classMinute] = targetLiveClass.startTime.split(':').map(Number);
      const classStartMinutes = classHour * 60 + classMinute;
      
      // إذا تأخر أكثر من 15 دقيقة عن بداية الحصة
      if (currentTimeMinutes > classStartMinutes + 15) {
        attendanceStatus = 'late';
      }
    }

    if (attendanceIndex >= 0) {
      // تحديث السجل الموجود
      targetLiveClass.attendance[attendanceIndex].status = attendanceStatus;
      targetLiveClass.attendance[attendanceIndex].joinedAt = now;
      console.log(`🔄 تحديث سجل الحضور: ${attendanceStatus}`);
    } else {
      // إضافة سجل جديد
      targetLiveClass.attendance.push({
        student: student._id,
        status: attendanceStatus,
        joinedAt: now,
        leftAt: null
      });
      console.log(`➕ إضافة سجل حضور جديد: ${attendanceStatus}`);
    }

    await targetLiveClass.save();
    console.log(`✅ تم تسجيل ${attendanceStatus === 'present' ? 'حضور' : 'تأخير'} الطالب ${student.name}`);

    // 5. إرسال رسالة SMS لولي الأمر (اختياري)
    let smsSent = false;
    let smsError = null;

    if (sendSMS && student.parentPhone) {
      try {
        let cleanPhone = student.parentPhone.trim();
        if (!cleanPhone.startsWith('+')) {
          if (cleanPhone.startsWith('0')) {
            cleanPhone = '+213' + cleanPhone.substring(1);
          } else {
            cleanPhone = '+213' + cleanPhone;
          }
        }

        const smsMessage = 
          `📚 إشعار حضور\n` +
          `عزيزي ولي أمر الطالب ${student.name}\n` +
          `تم تسجيل ${attendanceStatus === 'present' ? 'حضور' : 'تأخير'} الطالب في حصة ${targetLiveClass.class.name}\n` +
          `📅 التاريخ: ${new Date().toLocaleDateString('ar-EG')}\n` +
          `⏰ وقت التسجيل: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`;

        console.log(`📱 جاري إرسال رسالة إلى: ${cleanPhone}`);
        
        // استخدم خدمة SMS الموجودة لديك
        if (typeof smsGateway !== 'undefined' && smsGateway.sendIndividualSMS) {
          const result = await smsGateway.sendIndividualSMS(cleanPhone, smsMessage);
          smsSent = result.success;
          smsError = result.error;
          
          if (smsSent) {
            console.log(`✅ تم إرسال الرسالة بنجاح`);
            
            // حفظ سجل الرسالة
            try {
              const messageRecord = new Message({
                sender: null,
                recipients: [{
                  student: student._id,
                  parentPhone: cleanPhone
                }],
                class: targetLiveClass.class._id,
                content: smsMessage,
                messageType: 'individual',
                status: 'sent'
              });
              await messageRecord.save({ validateBeforeSave: false });
            } catch (saveError) {
              console.error('⚠️ خطأ في حفظ سجل الرسالة:', saveError);
            }
          } else {
            console.error(`❌ فشل إرسال الرسالة: ${smsError}`);
          }
        } else {
          console.log(`⚠️ خدمة SMS غير متاحة`);
        }
      } catch (err) {
        smsError = err.message;
        console.error('❌ خطأ في إرسال SMS:', err);
      }
    }

    // 6. إرجاع النتيجة
    res.json({
      success: true,
      message: `تم تسجيل ${attendanceStatus === 'present' ? 'حضور' : 'تأخير'} الطالب ${student.name} في حصة ${targetLiveClass.class.name} بنجاح${smsSent ? ' وتم إرسال إشعار لولي الأمر' : ''}`,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId
        },
        class: {
          _id: targetLiveClass.class._id,
          name: targetLiveClass.class.name,
          subject: targetLiveClass.class.subject,
          teacher: targetLiveClass.teacher?.name
        },
        liveClass: {
          _id: targetLiveClass._id,
          startTime: targetLiveClass.startTime,
          endTime: targetLiveClass.endTime,
          status: targetLiveClass.status
        },
        attendance: {
          status: attendanceStatus,
          recordedAt: now
        },
        sms: {
          sent: smsSent,
          error: smsError,
          phone: student.parentPhone
        },
        timestamp: now
      }
    });

  } catch (err) {
    console.error('❌ خطأ في تسجيل الحضور:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});
    // في server.js، أضف هذا الكود مع نقاط النهاية الأخرى
// ==============================================
app.post('/api/attendance/quick-register', async (req, res) => {
  try {
    const { cardUid } = req.body;
    
    console.log(`🔍 بدء التسجيل السريع للغياب للبطاقة: ${cardUid}`);
    
    if (!cardUid) {
      return res.status(400).json({
        success: false,
        error: 'رقم البطاقة مطلوب'
      });
    }

    // 1. البحث عن البطاقة والطالب المرتبط بها
    const card = await Card.findOne({ uid: cardUid }).populate('student');
    
    if (!card) {
      console.log('❌ بطاقة غير معروفة:', cardUid);
      
      // التحقق مما إذا كانت البطاقة مصرحة ولكن غير مرتبطة بطالب
      const authorizedCard = await AuthorizedCard.findOne({ 
        uid: cardUid, 
        active: true,
        expirationDate: { $gte: new Date() }
      });
      
      if (authorizedCard) {
        return res.status(404).json({
          success: false,
          error: 'بطاقة مصرحة ولكن غير مرتبطة بطالب',
          cardType: 'authorized',
          cardInfo: {
            uid: authorizedCard.uid,
            cardName: authorizedCard.cardName,
            expirationDate: authorizedCard.expirationDate
          }
        });
      }
      
      return res.status(404).json({
        success: false,
        error: 'البطاقة غير معروفة في النظام',
        cardUid: cardUid
      });
    }

    const student = card.student;
    
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'الطالب غير موجود أو تم حذفه'
      });
    }

    console.log(`✅ تم العثور على الطالب: ${student.name} (${student.studentId})`);

    // 2. التحقق من حالة الطالب
    if (!student.active || student.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'الطالب غير نشط أو حسابه معلق',
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          status: student.status,
          active: student.active
        }
      });
    }

    // 3. تحديد الوقت الحالي ويوم الأسبوع
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    
    const daysMap = {
      0: 'الأحد',
      1: 'الإثنين',
      2: 'الثلاثاء',
      3: 'الأربعاء',
      4: 'الخميس',
      5: 'الجمعة',
      6: 'السبت'
    };
    const currentDay = daysMap[now.getDay()];
    
    console.log(`📅 اليوم: ${currentDay}, الوقت: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`);

    // 4. البحث عن الحصص التي يمكن للطالب تسجيل الغياب فيها
    //    (الحصص التي هو مسجل فيها والتي وقتها الآن أو على وشك البدء)
    
    // الحصول على جميع حصص الطالب
    const studentClasses = await Class.find({
      _id: { $in: student.classes || [] },
      'schedule.day': currentDay
    }).populate('teacher', 'name phone email');
    
    if (studentClasses.length === 0) {
      console.log('❌ لا توجد حصص للطالب في هذا اليوم');
      return res.status(404).json({
        success: false,
        error: 'لا توجد حصص مجدولة للطالب في هذا اليوم',
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId
        }
      });
    }

    // البحث عن الحصة المناسبة (الحصة التي وقتها الآن)
    let selectedClass = null;
    let selectedSchedule = null;
    const availableClasses = [];

    for (const classObj of studentClasses) {
      for (const schedule of classObj.schedule || []) {
        if (schedule.day === currentDay && schedule.time) {
          const [hour, minute] = schedule.time.split(':').map(Number);
          const classStartMinutes = hour * 60 + minute;
          const classEndMinutes = classStartMinutes + 120; // افتراض أن الحصة مدتها ساعتين
          
          // التحقق مما إذا كان الوقت الحالي ضمن فترة الحصة (مع هامش 30 دقيقة)
          const timeDiff = Math.abs(currentTimeMinutes - classStartMinutes);
          
          availableClasses.push({
            class: classObj,
            schedule: schedule,
            startTime: schedule.time,
            startMinutes: classStartMinutes,
            endMinutes: classEndMinutes,
            timeDiff: timeDiff,
            isActive: currentTimeMinutes >= classStartMinutes && currentTimeMinutes <= classEndMinutes,
            willStartSoon: timeDiff <= 30 && currentTimeMinutes < classStartMinutes // سيبدأ خلال 30 دقيقة
          });
        }
      }
    }

    // ترتيب حسب الفرق الزمني
    availableClasses.sort((a, b) => a.timeDiff - b.timeDiff);

    // اختيار الحصة النشطة أولاً، ثم الحصة التي ستبدأ قريباً
    const activeClass = availableClasses.find(c => c.isActive);
    const soonClass = availableClasses.find(c => c.willStartSoon);
    
    selectedClass = activeClass || soonClass || (availableClasses.length > 0 ? availableClasses[0] : null);

    if (!selectedClass) {
      console.log('❌ لا توجد حصص مناسبة للطالب في هذا الوقت');
      return res.status(404).json({
        success: false,
        error: 'لا توجد حصص مناسبة للطالب في هذا الوقت',
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId
        },
        availableClasses: availableClasses.map(c => ({
          className: c.class.name,
          subject: c.class.subject,
          time: c.startTime,
          status: c.isActive ? 'نشطة' : (c.willStartSoon ? 'قادمة' : 'غير متاحة')
        }))
      });
    }

    console.log(`✅ تم اختيار الحصة: ${selectedClass.class.name} في ${selectedClass.startTime}`);

    // 5. البحث عن حصة حية (Live Class) لهذه الحصة في هذا اليوم
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    let liveClass = await LiveClass.findOne({
      class: selectedClass.class._id,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    }).populate('attendance.student');

    // إذا لم توجد حصة حية، قم بإنشائها
    if (!liveClass) {
      console.log('📝 إنشاء حصة حية جديدة...');
      
      // جلب جميع طلاب الحصة
      const classWithStudents = await Class.findById(selectedClass.class._id)
        .populate('students', 'name studentId parentPhone');
      
      // إنشاء سجلات الغياب لجميع الطلاب (افتراضي: غائب)
      const attendance = (classWithStudents.students || []).map(student => ({
        student: student._id,
        status: 'absent',
        joinedAt: null,
        leftAt: null
      }));

      liveClass = new LiveClass({
        class: selectedClass.class._id,
        date: now,
        startTime: selectedClass.startTime,
        endTime: selectedClass.schedule.endTime || `${selectedClass.startTime.split(':')[0]}:00`,
        teacher: selectedClass.class.teacher?._id,
        classroom: selectedClass.schedule.classroom,
        attendance: attendance,
        status: 'ongoing',
        createdBy: req.user?.id || null,
        month: now.toISOString().slice(0, 7)
      });

      await liveClass.save();
      console.log(`✅ تم إنشاء حصة حية جديدة: ${liveClass._id}`);
      
      // إعادة جلب مع البيانات المترابطة
      liveClass = await LiveClass.findById(liveClass._id)
        .populate('attendance.student');
    }

    // 6. تحديث حالة حضور الطالب
    const attendanceIndex = liveClass.attendance.findIndex(
      att => att.student._id.toString() === student._id.toString()
    );

    // تحديد حالة الحضور (حاضر أو متأخر)
    let attendanceStatus = 'present';
    
    if (selectedClass.startTime) {
      const [classHour, classMinute] = selectedClass.startTime.split(':').map(Number);
      const classStartMinutes = classHour * 60 + classMinute;
      
      // إذا تأخر أكثر من 15 دقيقة عن بداية الحصة
      if (currentTimeMinutes > classStartMinutes + 15) {
        attendanceStatus = 'late';
      }
    }

    if (attendanceIndex >= 0) {
      // تحديث السجل الموجود
      liveClass.attendance[attendanceIndex].status = attendanceStatus;
      liveClass.attendance[attendanceIndex].joinedAt = now;
      console.log(`🔄 تحديث سجل الحضور: ${attendanceStatus}`);
    } else {
      // إضافة سجل جديد
      liveClass.attendance.push({
        student: student._id,
        status: attendanceStatus,
        joinedAt: now,
        leftAt: null
      });
      console.log(`➕ إضافة سجل حضور جديد: ${attendanceStatus}`);
    }

    await liveClass.save();

    // 7. إرسال إشعار SMS لولي الأمر (اختياري)
    let smsSent = false;
    if (student.parentPhone && req.body.sendSMS !== false) {
      try {
        const smsMessage = `تم تسجيل ${attendanceStatus === 'present' ? 'حضور' : 'تأخير'} الطالب ${student.name} في حصة ${selectedClass.class.name} الساعة ${currentHour}:${currentMinute.toString().padStart(2, '0')}.`;
        
        const smsResult = await smsGateway.sendIndividualSMS(student.parentPhone, smsMessage);
        
        if (smsResult.success) {
          smsSent = true;
          
          // حفظ سجل الرسالة
          const message = new Message({
            sender: req.user?.id || null,
            recipients: [{
              student: student._id,
              parentPhone: student.parentPhone
            }],
            class: selectedClass.class._id,
            content: smsMessage,
            messageType: 'individual',
            status: 'sent'
          });
          await message.save({ validateBeforeSave: false });
        }
      } catch (smsErr) {
        console.error('❌ فشل إرسال SMS:', smsErr);
      }
    }

    // 8. إرجاع الاستجابة
    res.json({
      success: true,
      message: `تم تسجيل ${attendanceStatus === 'present' ? 'الحضور' : 'التأخير'} بنجاح للطالب ${student.name}`,
      timestamp: now,
      data: {
        student: {
          _id: student._id,
          name: student.name,
          studentId: student.studentId,
          academicYear: student.academicYear
        },
        class: {
          _id: selectedClass.class._id,
          name: selectedClass.class.name,
          subject: selectedClass.class.subject,
          teacher: selectedClass.class.teacher?.name || 'غير محدد'
        },
        attendance: {
          status: attendanceStatus,
          time: now,
          scheduledTime: selectedClass.startTime
        },
        liveClass: {
          _id: liveClass._id,
          date: liveClass.date,
          startTime: liveClass.startTime
        },
        sms: smsSent ? 'تم إرسال إشعار لولي الأمر' : 'لم يتم إرسال إشعار'
      }
    });

  } catch (err) {
    console.error('❌ خطأ في التسجيل السريع للغياب:', err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// ==============================================
// نقطة نهاية للحصول على الحصة المناسبة للطالب
// ==============================================
app.get('/api/attendance/available-class/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'الطالب غير موجود'
      });
    }

    // تحديد الوقت الحالي ويوم الأسبوع
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;
    
    const daysMap = {
      0: 'الأحد',
      1: 'الإثنين',
      2: 'الثلاثاء',
      3: 'الأربعاء',
      4: 'الخميس',
      5: 'الجمعة',
      6: 'السبت'
    };
    const currentDay = daysMap[now.getDay()];

    // البحث عن الحصص المتاحة
    const availableClasses = await Class.find({
      _id: { $in: student.classes || [] },
      'schedule.day': currentDay
    }).populate('teacher', 'name');

    const classesWithTimeInfo = [];

    for (const classObj of availableClasses) {
      for (const schedule of classObj.schedule || []) {
        if (schedule.day === currentDay && schedule.time) {
          const [hour, minute] = schedule.time.split(':').map(Number);
          const classStartMinutes = hour * 60 + minute;
          const timeDiff = Math.abs(currentTimeMinutes - classStartMinutes);
          
          classesWithTimeInfo.push({
            class: {
              _id: classObj._id,
              name: classObj.name,
              subject: classObj.subject,
              teacher: classObj.teacher?.name || 'غير محدد'
            },
            schedule: {
              time: schedule.time,
              classroom: schedule.classroom
            },
            timeInfo: {
              currentTime: `${currentHour}:${currentMinute.toString().padStart(2, '0')}`,
              classStartTime: schedule.time,
              timeDiff: timeDiff,
              isActive: currentTimeMinutes >= classStartMinutes && currentTimeMinutes <= classStartMinutes + 120,
              willStartSoon: timeDiff <= 30 && currentTimeMinutes < classStartMinutes,
              minutesUntilStart: currentTimeMinutes < classStartMinutes ? classStartMinutes - currentTimeMinutes : null,
              minutesSinceStart: currentTimeMinutes > classStartMinutes ? currentTimeMinutes - classStartMinutes : null
            }
          });
        }
      }
    }

    // ترتيب حسب الفرق الزمني
    classesWithTimeInfo.sort((a, b) => a.timeInfo.timeDiff - b.timeInfo.timeDiff);

    res.json({
      success: true,
      student: {
        _id: student._id,
        name: student.name,
        studentId: student.studentId
      },
      currentTime: {
        day: currentDay,
        time: `${currentHour}:${currentMinute.toString().padStart(2, '0')}`,
        timestamp: now
      },
      availableClasses: classesWithTimeInfo,
      recommendedClass: classesWithTimeInfo.find(c => c.timeInfo.isActive) || 
                        classesWithTimeInfo.find(c => c.timeInfo.willStartSoon) ||
                        classesWithTimeInfo[0] || null
    });

  } catch (err) {
    console.error('Error getting available classes:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
  // 1. نقطة نهاية لمعالجة الغياب بعد الحصة وإرسال رسائل تلقائية
  app.post('/api/live-classes/:id/process-absences',  async (req, res) => {
    try {
      const liveClassId = req.params.id;
      const { sendSMS = true, customMessage } = req.body;

      console.log(`=== معالجة غيابات الحصة ${liveClassId} ===`);

      // الحصول على الحصة الحية
      const liveClass = await LiveClass.findById(liveClassId)
        .populate('class')
        .populate('attendance.student');

      if (!liveClass) {
        return res.status(404).json({ 
          success: false,
          error: 'الحصة غير موجودة' 
        });
      }

      if (liveClass.status !== 'completed') {
        return res.status(400).json({ 
          success: false,
          error: 'الحصة لم تنته بعد، يجب أن تكون الحصة مكتملة' 
        });
      }

      // جلب جميع طلاب الحصة الأصلية
      const classObj = await Class.findById(liveClass.class._id)
        .populate('students', 'name studentId parentPhone parentEmail academicYear');

      if (!classObj) {
        return res.status(404).json({ 
          success: false,
          error: 'الحصة الأصلية غير موجودة' 
        });
      }

      const allStudents = classObj.students;
      const presentStudents = liveClass.attendance
        .filter(att => att.status === 'present' || att.status === 'late')
        .map(att => att.student._id.toString());

      // تحديد الطلاب الغائبين
      const absentStudents = allStudents.filter(student => 
        !presentStudents.includes(student._id.toString())
      );

      console.log(`📊 الإحصائيات:
      - إجمالي الطلاب: ${allStudents.length}
      - الحاضرون: ${presentStudents.length}
      - الغائبون: ${absentStudents.length}`);

      // إعداد الرسائل
      const results = {
        totalStudents: allStudents.length,
        presentCount: presentStudents.length,
        absentCount: absentStudents.length,
        absentStudents: [],
        messagesSent: 0,
        failedMessages: []
      };

      // إرسال رسائل للغائبين إذا كان الخيار مفعلاً
      if (sendSMS && absentStudents.length > 0) {
        console.log(`📱 إرسال رسائل للطلاب الغائبين...`);

        for (const student of absentStudents) {
          try {
            if (student.parentPhone) {
              // نص الرسالة الافتراضي أو المخصص
              const message = customMessage || 
                `عزيزي ولي أمر الطالب ${student.name}، نود إعلامكم أن الطالب غائب عن حصة ${liveClass.class.name} بتاريخ ${new Date(liveClass.date).toLocaleDateString('ar-EG')}. نرجو التواصل مع الإدارة لمعرفة السبب.`;

              // إرسال الرسالة
              const smsResult = await smsGateway.sendIndividualSMS(
                student.parentPhone,
                message
              );

              // حفظ سجل الرسالة في قاعدة البيانات
              const messageRecord = new Message({
                sender: req.user.id,
                recipients: [{
                  student: student._id,
                  parentPhone: student.parentPhone,
                  parentEmail: student.parentEmail
                }],
                class: liveClass.class._id,
                content: message,
                messageType: 'individual',
                status: smsResult.success ? 'sent' : 'failed'
              });
              await messageRecord.save();

              results.absentStudents.push({
                studentId: student._id,
                name: student.name,
                parentPhone: student.parentPhone,
                messageSent: smsResult.success,
                message: smsResult.success ? 'تم الإرسال' : 'فشل الإرسال'
              });

              if (smsResult.success) {
                results.messagesSent++;
              } else {
                results.failedMessages.push({
                  student: student.name,
                  phone: student.parentPhone,
                  error: smsResult.error
                });
              }

              // تأخير بسيط لتجنب تجاوز حدود API
              await new Promise(resolve => setTimeout(resolve, 100));
            } else {
              results.absentStudents.push({
                studentId: student._id,
                name: student.name,
                parentPhone: null,
                messageSent: false,
                message: 'لا يوجد رقم هاتف'
              });
            }
          } catch (error) {
            console.error(`❌ خطأ في إرسال رسالة للطالب ${student.name}:`, error);
            results.failedMessages.push({
              student: student.name,
              phone: student.parentPhone,
              error: error.message
            });
          }
        }
      }

      // تحديث سجلات الغياب في الحصة الحية
      for (const student of absentStudents) {
        // التحقق مما إذا كان الطالب لديه سجل حضور بالفعل
        const existingAttendance = liveClass.attendance.find(
          att => att.student._id.toString() === student._id.toString()
        );

        if (!existingAttendance) {
          // إضافة سجل غياب
          liveClass.attendance.push({
            student: student._id,
            status: 'absent',
            joinedAt: null,
            leftAt: null
          });
        }
      }

      await liveClass.save();

      res.json({
        success: true,
        message: `تم معالجة ${absentStudents.length} طالب غائب${sendSMS ? ` وإرسال ${results.messagesSent} رسالة` : ''}`,
        data: results,
        classInfo: {
          name: liveClass.class.name,
          date: liveClass.date,
          time: liveClass.startTime
        }
      });

    } catch (err) {
      console.error('❌ خطأ في معالجة الغيابات:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });

  // 2. نقطة نهاية لإرسال رسائل جماعية لحصة معينة
  app.post('/api/live-classes/:id/send-bulk-messages',  async (req, res) => {
    try {
      const liveClassId = req.params.id;
      const { message, recipientType = 'all', customRecipients = [] } = req.body;

      console.log(`📨 إرسال رسائل جماعية للحصة ${liveClassId}`);

      if (!message || message.trim().length < 5) {
        return res.status(400).json({ 
          success: false,
          error: 'يجب إدخال نص الرسالة (5 أحرف على الأقل)' 
        });
      }

      const liveClass = await LiveClass.findById(liveClassId)
        .populate('class')
        .populate('attendance.student');

      if (!liveClass) {
        return res.status(404).json({ 
          success: false,
          error: 'الحصة غير موجودة' 
        });
      }

      // جلب جميع طلاب الحصة
      const classObj = await Class.findById(liveClass.class._id)
        .populate('students', 'name studentId parentPhone parentEmail');

      if (!classObj) {
        return res.status(404).json({ 
          success: false,
          error: 'الحصة الأصلية غير موجودة' 
        });
      }

      let recipients = [];

      switch (recipientType) {
        case 'all':
          // جميع الطلاب
          recipients = classObj.students;
          break;
        case 'present':
          // الطلاب الحاضرين فقط
          const presentStudentIds = liveClass.attendance
            .filter(att => att.status === 'present' || att.status === 'late')
            .map(att => att.student._id.toString());
          recipients = classObj.students.filter(student => 
            presentStudentIds.includes(student._id.toString())
          );
          break;
        case 'absent':
          // الطلاب الغائبين فقط
          const absentStudentIds = classObj.students
            .filter(student => 
              !liveClass.attendance.some(att => 
                att.student._id.toString() === student._id.toString() && 
                (att.status === 'present' || att.status === 'late')
              )
            )
            .map(student => student._id.toString());
          recipients = classObj.students.filter(student => 
            absentStudentIds.includes(student._id.toString())
          );
          break;
        case 'custom':
          // قائمة مخصصة من الأرقام
          recipients = customRecipients.map(phone => ({ parentPhone: phone }));
          break;
      }

      // تصفية الطلاب الذين لديهم أرقام هواتف
      const studentsWithPhones = recipients.filter(s => s.parentPhone);
      const phoneNumbers = studentsWithPhones.map(s => s.parentPhone);

      console.log(`👥 عدد المستلمين: ${phoneNumbers.length}`);

      if (phoneNumbers.length === 0) {
        return res.status(400).json({ 
          success: false,
          error: 'لا يوجد مستلمين بأرقام هواتف صالحة' 
        });
      }

      // إرسال الرسائل
      const smsResult = await smsGateway.sendBulkSMS(phoneNumbers, message);

      // حفظ سجل الرسالة
      const messageRecord = new Message({
        sender: req.user.id,
        recipients: studentsWithPhones.map(student => ({
          student: student._id || null,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail
        })),
        class: liveClass.class._id,
        content: message,
        messageType: 'class',
        status: smsResult.success ? 'sent' : 'failed'
      });
      await messageRecord.save();

      res.json({
        success: true,
        message: `تم إرسال الرسالة إلى ${phoneNumbers.length} مستلم`,
        data: {
          recipientsCount: phoneNumbers.length,
          message: message,
          smsResult: smsResult,
          recipientType: recipientType
        }
      });

    } catch (err) {
      console.error('❌ خطأ في إرسال الرسائل الجماعية:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });
// DELETE /api/live-classes/:id - حذف حصة حية
// Cancel a live class - تحديث حالة الغرفة إلى متاحة
app.delete('/api/live-classes/:id', async (req, res) => {
  try {
    const liveClassId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(liveClassId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الحصة غير صالح'
      });
    }
    
    const liveClass = await LiveClass.findById(liveClassId)
      .populate('classroom', 'name status');
    
    if (!liveClass) {
      return res.status(404).json({
        success: false,
        error: 'الحصة الحية غير موجودة'
      });
    }
    
    // ==============================================
    // تحديث حالة الغرفة إلى "متاحة" إذا كانت مشغولة
    // ==============================================
    let classroomUpdated = false;
    if (liveClass.classroom) {
      const classroom = await Classroom.findById(liveClass.classroom._id);
      if (classroom && classroom.status === 'occupied') {
        classroom.status = 'available';
        classroom.updatedAt = new Date();
        await classroom.save();
        classroomUpdated = true;
        console.log(`✅ تم تحديث حالة الغرفة ${classroom.name} إلى "متاحة" (إلغاء الحصة)`);
      }
    }
    
    // حذف الحصة الحية
    await LiveClass.findByIdAndDelete(liveClassId);
    
    res.json({
      success: true,
      message: 'تم إلغاء الحصة الحية بنجاح',
      classroomUpdated: classroomUpdated ? {
        classroomId: liveClass.classroom._id,
        newStatus: 'available'
      } : null
    });
    
  } catch (err) {
    console.error('Error deleting live class:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
// دالة مساعدة لإرسال إشعارات الغياب
async function sendAbsenceNotifications(absentStudents, liveClass) {
  const results = { sent: 0, failed: 0, details: [] };
  
  for (const att of absentStudents) {
    const student = att.student;
    if (student && student.parentPhone) {
      try {
        let cleanPhone = student.parentPhone.trim();
        if (!cleanPhone.startsWith('+')) {
          if (cleanPhone.startsWith('0')) {
            cleanPhone = '+213' + cleanPhone.substring(1);
          } else {
            cleanPhone = '+213' + cleanPhone;
          }
        }
        
        const smsMessage = 
          `📚 إشعار غياب\n` +
          `عزيزي ولي أمر الطالب ${student.name}\n` +
          `يؤسفنا إعلامكم بأن الطالب غائب عن حصة ${liveClass.class?.name || 'المدرسة'}\n` +
          `📅 التاريخ: ${new Date(liveClass.date).toLocaleDateString('ar-EG')}\n` +
          `⏰ الوقت: ${liveClass.startTime}\n` +
          `👨‍🏫 المعلم: ${liveClass.teacher?.name || 'غير محدد'}\n` +
          `📞 نرجو التواصل مع الإدارة.`;
        
        const smsResult = await smsGateway.sendIndividualSMS(cleanPhone, smsMessage);
        
        if (smsResult.success) {
          results.sent++;
          results.details.push({ student: student.name, success: true });
        } else {
          results.failed++;
          results.details.push({ student: student.name, success: false, error: smsResult.error });
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        results.failed++;
        results.details.push({ student: student.name, success: false, error: err.message });
      }
    }
  }
  
  return results;
}
//deletAll
app.delete('/api/live-classesDeletDg192',  async (req, res) => {
  try {
    await LiveClass.deleteMany({});
    res.json({
      success: true,
      message: 'تم حذف جميع الحصص الحية بنجاح'
    });
  } catch (err) {
    console.error('❌ خطأ في حذف جميع الحصص الحية:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});
  // 3. نقطة نهاية لإرسال تذكير بالدفع للطلاب المتأخرين
  app.post('/api/messages/send-payment-reminders', authenticate(['accountant', 'admin']), async (req, res) => {
    try {
      const { classId, month, customMessage } = req.body;

      console.log(`💰 إرسال تذكير بالدفع`);

      // جلب الطلاب المتأخرين في الدفع
      const pendingPayments = await Payment.find({
        class: classId,
        month: month,
        status: { $in: ['pending', 'late'] }
      }).populate('student', 'name parentPhone parentEmail');

      if (pendingPayments.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'لا توجد دفعات متأخرة' 
        });
      }

      // الحصول على معلومات الحصة
      const classObj = await Class.findById(classId);
      
      const results = {
        totalReminders: pendingPayments.length,
        sent: 0,
        failed: 0,
        details: []
      };

      // إرسال رسائل تذكير
      for (const payment of pendingPayments) {
        try {
          if (payment.student?.parentPhone) {
            const message = customMessage || 
              `عزيزي ولي أمر الطالب ${payment.student.name}، نود تذكيركم بأن دفعة الحصة ${classObj?.name || ''} لشهر ${month} بقيمة ${payment.amount} د.ج ما زالت معلقة. يرجى التسديد في أقرب وقت.`;

            const smsResult = await smsGateway.sendIndividualSMS(
              payment.student.parentPhone,
              message
            );

            // حفظ سجل الرسالة
            const messageRecord = new Message({
              sender: req.user.id,
              recipients: [{
                student: payment.student._id,
                parentPhone: payment.student.parentPhone
              }],
              class: classId,
              content: message,
              messageType: 'payment',
              status: smsResult.success ? 'sent' : 'failed'
            });
            await messageRecord.save();

            results.details.push({
              student: payment.student.name,
              phone: payment.student.parentPhone,
              amount: payment.amount,
              month: payment.month,
              success: smsResult.success
            });

            if (smsResult.success) {
              results.sent++;
            } else {
              results.failed++;
            }

            // تأخير بين الرسائل
            await new Promise(resolve => setTimeout(resolve, 150));
          }
        } catch (error) {
          console.error(`❌ خطأ في إرسال تذكير للطالب ${payment.student?.name}:`, error);
          results.failed++;
        }
      }

      res.json({
        success: true,
        message: `تم إرسال ${results.sent} تذكير بالدفع`,
        data: results
      });

    } catch (err) {
      console.error('❌ خطأ في إرسال تذكير الدفع:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });

  // 4. نقطة نهاية للحصول على سجل الرسائل المرسلة
  app.get('/api/messages/history', authenticate(['admin', 'teacher', 'accountant']), async (req, res) => {
    try {
      const { startDate, endDate, messageType, classId, limit = 50 } = req.query;

      const query = {};

      if (messageType) query.messageType = messageType;
      if (classId) query.class = classId;
      if (startDate || endDate) {
        query.sentAt = {};
        if (startDate) query.sentAt.$gte = new Date(startDate);
        if (endDate) query.sentAt.$lte = new Date(endDate);
      }

      const messages = await Message.find(query)
        .populate('sender', 'username fullName')
        .populate('recipients.student', 'name studentId')
        .populate('class', 'name')
        .sort({ sentAt: -1 })
        .limit(parseInt(limit));

      // تحليل الإحصائيات
      const stats = {
        total: messages.length,
        byType: {},
        successRate: 0
      };

      messages.forEach(msg => {
        stats.byType[msg.messageType] = (stats.byType[msg.messageType] || 0) + 1;
      });

      const successfulMessages = messages.filter(msg => msg.status === 'sent').length;
      stats.successRate = messages.length > 0 ? Math.round((successfulMessages / messages.length) * 100) : 0;

      res.json({
        success: true,
        messages: messages,
        stats: stats,
        totalCount: await Message.countDocuments(query)
      });

    } catch (err) {
      console.error('❌ خطأ في جلب سجل الرسائل:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });

  // 5. نقطة نهاية للتحقق من حالة إرسال الرسالة
  app.get('/api/messages/:id/status', authenticate(['admin', 'teacher', 'accountant']), async (req, res) => {
    try {
      const message = await Message.findById(req.params.id)
        .populate('sender', 'username fullName')
        .populate('recipients.student', 'name')
        .populate('class', 'name');

      if (!message) {
        return res.status(404).json({ 
          success: false,
          error: 'الرسالة غير موجودة' 
        });
      }

      res.json({
        success: true,
        message: message,
        recipientsCount: message.recipients.length,
        sentDate: message.sentAt
      });

    } catch (err) {
      console.error('❌ خطأ في جلب حالة الرسالة:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });


    app.get('/student/status/:studentId', async (req, res) => {
      try {
        const student = await Student.findOne({ studentId: req.params.studentId });
        if (!student) {
          return res.status(404).json({ error: 'الطالب غير موجود' });
        }
        res.json({
          status: student.status,
          active: student.active,
          name: student.name,
          registrationDate: student.registrationDate
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });


    const angularPath = path.join(__dirname, 'dist/admin-app/browser');
    // const angularPath = path.join(__dirname, 'public/index.html');
    app.use(express.static(angularPath));

    // Main application entry point
// ==============================================
// FRONTEND PAGE ROUTES
// ==============================================

// Landing Page

// Admin Routes


// Teacher Routes








app.get('/cards-auth', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cards-auth.html'));
});


// Dore (Rounds) Management Routes
app.get('/dore',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dore.html'));
});

app.get('/dore/*',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dore.html'));
});

// Attendance Management Routes
app.get('/attendance',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'attendance.html'));
});

app.get('/attendance/*',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'attendance.html'));
});

// Reports Routes
app.get('/reports',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reports.html'));
});

app.get('/reports/*',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reports.html'));
});

// Classes Management Routes
app.get('/classes',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'classes.html'));
});

app.get('/classes/*',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'classes.html'));
});

// Payments Management Routes
app.get('/payments',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payments.html'));
});

app.get('/payments/*',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payments.html'));
});

// Students Management Routes
app.get('/students',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'students.html'));
});

app.get('/students/*',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'students.html'));
});

// Teachers Management Routes
app.get('/teachers', authenticate(['admin', 'secretary']), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teachers.html'));
});

app.get('/teachers/*', authenticate(['admin', 'secretary']), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teachers.html'));
});

// Settings Routes
app.get('/settings', authenticate(['admin']), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

// Profile Routes
app.get('/profile',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

// Help Routes
app.get('/help', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'help.html'));
});

// About Routes
app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

// Contact Routes
app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

// Privacy Policy
app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'privacy.html'));
});

// Terms of Service
app.get('/terms', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'terms.html'));
});

// ==============================================
// ADDITIONAL ROUTES FOR SPECIFIC PAGES
// ==============================================

// Live Classes Management
app.get('/live-classes', authenticate(['admin', 'teacher']), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'live-classes.html'));
});

// Class Attendance Page
app.get('/class-attendance/:classId', authenticate(['admin', 'teacher']), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'class-attendance.html'));
});

// Student Details Page
app.get('/student/:id',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'student-details.html'));
});

// Teacher Details Page
app.get('/teacher/:id', authenticate(['admin', 'secretary']), (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'teacher-details.html'));
});

// Class Details Page
app.get('/class/:id',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'class-details.html'));
});

// Payment Details Page
app.get('/payment/:id',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment-details.html'));
});

// Invoice Page
app.get('/invoice/:id',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'invoice.html'));
});

// Receipt Page
app.get('/receipt/:id',  (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'receipt.html'));
});

// Dashboard Routes
app.get('/dashboard',  (req, res) => {
  // Redirect based on role
  if (req.user.role === 'admin') {
    res.redirect('/admin');
  } else if (req.user.role === 'teacher') {
    res.redirect('/teacher');
  } else if (req.user.role === 'student') {
    res.redirect('/student/dashboard');
  } else if (req.user.role === 'accountant') {
    res.redirect('/accounting');
  } else {
    res.redirect('/');
  }
});

// ==============================================
// PUBLIC ROUTES (No Authentication Required)
// ==============================================

// Public assets (CSS, JS, images)
app.get('/css/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.path));
});

app.get('/js/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.path));
});

app.get('/assets/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', req.path));
});

// Favicon
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'assets', 'favicon.ico'));
});

// ==============================================
// AUTHENTICATION ROUTES
// ==============================================

// Login Page
app.get('/login', (req, res) => {
  if (req.headers.authorization) {
    res.redirect('/dashboard');
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});

// Forgot Password
app.get('/forgot-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'forgot-password.html'));
});

// Reset Password
app.get('/reset-password/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'reset-password.html'));
});

// ==============================================
// ERROR PAGES
// ==============================================

// 404 Page
app.get('/404', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// 403 Page (Forbidden)
app.get('/403', (req, res) => {
  res.status(403).sendFile(path.join(__dirname, 'public', '403.html'));
});

// 500 Page (Server Error)
app.get('/500', (req, res) => {
  res.status(500).sendFile(path.join(__dirname, 'public', '500.html'));
});

// ==============================================
// CATCH-ALL ROUTE (Must be at the end)
// ==============================================

// For any other routes, serve the main Angular app or redirect to 404
app.get('*', (req, res) => {
  // Don't redirect API requests
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // For file extensions, try to serve static files
  if (req.path.includes('.')) {
    const filePath = path.join(__dirname, 'public', req.path);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
  }
  
  // If it's an HTML page request, redirect to 404
  if (req.accepts('html')) {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
  } else {
    res.status(404).json({ error: 'Page not found' });
  }
});


    app.get('cards-auth',(req,res)=>{
      res.sendFile(path.join(__dirname, 'public', 'cards-auth.html'));
    })
    app.get('dore',(req,res)=>{
      res.sendFile(path.join(__dirname, 'public', 'dore.html'));
    })
    

    // Admin dashboard
    app.get('/admin',  (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'admin.html'));
    });

    // Teacher dashboard
    app.get('/teacher',  (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'teacher.html'));
    });

    // Student routes
    app.get('/student', (req, res) => {
      res.redirect('/student/login');
    });

    app.get('/student/register', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'student-register.html'));
    });

    app.get('/student/login', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'student-login.html'));
    });
    // app.get('/accounting', (req, res) => {
    //   res.sendFile(path.join(__dirname, 'public', 'accounting.html'));
    // });

// ==============================================
// Teacher Commissions API Endpoints
// ==============================================

// GET /api/accounting/teacher-commissions - Get all teacher commissions with filters
// ==============================================
// Teacher Commissions API Endpoints
// ==============================================

// GET /api/accounting/teacher-commissions - Get all teacher commissions with filters



    app.get('/student/dashboard',  (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'student-dashboard.html'));
    });

    // Accounting Login Route
    // إحصائيات اليوم
    app.get('/api/accounting/today-stats', async (req, res) => {
      try {
        // Get today's date in Algeria timezone (UTC+1)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get tomorrow's date
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        console.log('Today stats query - Date range:', {
          today: today,
          tomorrow: tomorrow,
          todayISO: today.toISOString(),
          tomorrowISO: tomorrow.toISOString()
        });
    
        // Debug: Check what dates exist in the database
        const testPayments = await Payment.find({
          status: 'paid',
          paymentDate: { $ne: null }
        })
        .sort({ paymentDate: -1 })
        .limit(5)
        .select('paymentDate amount student month');
        
        console.log('Sample payment dates:', testPayments.map(p => ({
          paymentDate: p.paymentDate,
          amount: p.amount,
          month: p.month
        })));
    
        // OPTION 1: Using paymentDate field (for payments with recorded payment date)
        const todayPayments = await Payment.aggregate([
          {
            $match: {
              $or: [
                {
                  paymentDate: {
                    $gte: today,
                    $lt: tomorrow
                  }
                },
                // Also check if payment was created today (for payments without paymentDate)
                {
                  createdAt: {
                    $gte: today,
                    $lt: tomorrow
                  },
                  paymentDate: null
                }
              ],
              status: 'paid'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]);
    
        // OPTION 2: Alternative approach using created date
        const todayPaymentsAlt = await Payment.aggregate([
          {
            $match: {
              createdAt: {
                $gte: today,
                $lt: tomorrow
              },
              status: 'paid'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]);
    
        // مصروفات اليوم - check both date and createdAt fields
        const todayExpenses = await Expense.aggregate([
          {
            $match: {
              $or: [
                {
                  date: {
                    $gte: today,
                    $lt: tomorrow
                  }
                },
                {
                  createdAt: {
                    $gte: today,
                    $lt: tomorrow
                  },
                  date: null
                }
              ],
              status: 'paid'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]);
    
        // عمولات اليوم
        const todayCommissions = await TeacherCommission.aggregate([
          {
            $match: {
              $or: [
                {
                  paymentDate: {
                    $gte: today,
                    $lt: tomorrow
                  }
                },
                {
                  createdAt: {
                    $gte: today,
                    $lt: tomorrow
                  },
                  paymentDate: null
                }
              ],
              status: 'paid'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]);
    
        // Also check financial transactions for today
        const todayTransactions = await FinancialTransaction.aggregate([
          {
            $match: {
              $or: [
                {
                  date: {
                    $gte: today,
                    $lt: tomorrow
                  }
                },
                {
                  createdAt: {
                    $gte: today,
                    $lt: tomorrow
                  },
                  date: null
                }
              ]
            }
          },
          {
            $group: {
              _id: '$type',
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]);
    
        // Count all documents created today for debugging
        const todayCounts = {
          payments: await Payment.countDocuments({
            $or: [
              { paymentDate: { $gte: today, $lt: tomorrow } },
              { createdAt: { $gte: today, $lt: tomorrow } }
            ]
          }),
          expenses: await Expense.countDocuments({
            $or: [
              { date: { $gte: today, $lt: tomorrow } },
              { createdAt: { $gte: today, $lt: tomorrow } }
            ]
          }),
          commissions: await TeacherCommission.countDocuments({
            $or: [
              { paymentDate: { $gte: today, $lt: tomorrow } },
              { createdAt: { $gte: today, $lt: tomorrow } }
            ]
          }),
          transactions: await FinancialTransaction.countDocuments({
            $or: [
              { date: { $gte: today, $lt: tomorrow } },
              { createdAt: { $gte: today, $lt: tomorrow } }
            ]
          })
        };
    
        // Get detailed payment data for today
        const detailedPayments = await Payment.find({
          $or: [
            { paymentDate: { $gte: today, $lt: tomorrow } },
            { createdAt: { $gte: today, $lt: tomorrow } }
          ],
          status: 'paid'
        })
        .populate('student', 'name')
        .populate('class', 'name')
        .limit(10)
        .select('amount paymentDate createdAt student class month');
    
        const response = {
          date: today,
          dateRange: {
            start: today,
            end: tomorrow
          },
          payments: {
            total: todayPayments[0]?.total || 0,
            count: todayPayments[0]?.count || 0,
            alternative: {
              total: todayPaymentsAlt[0]?.total || 0,
              count: todayPaymentsAlt[0]?.count || 0
            }
          },
          expenses: {
            total: todayExpenses[0]?.total || 0,
            count: todayExpenses[0]?.count || 0
          },
          commissions: {
            total: todayCommissions[0]?.total || 0,
            count: todayCommissions[0]?.count || 0
          },
          transactions: todayTransactions,
          debug: {
            todayCounts,
            samplePayments: detailedPayments.map(p => ({
              amount: p.amount,
              paymentDate: p.paymentDate,
              createdAt: p.createdAt,
              student: p.student?.name,
              class: p.class?.name,
              month: p.month
            })),
            // Get first payment ever to see date format
            firstPayment: await Payment.findOne({ status: 'paid' })
              .sort({ paymentDate: 1 })
              .select('paymentDate amount month')
          }
        };
    
        console.log('Today stats response:', JSON.stringify(response, null, 2));
    
        res.json(response);
      } catch (err) {
        console.error('Error in today-stats:', err);
        res.status(500).json({ 
          error: err.message,
          stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
      }
    });
    // إضافة نقطة النهاية المطلوبة

    app.post('/api/payment-systems/rounds',  async (req, res) => {
      try {
        const { 
          studentId, 
          classId, 
          roundNumber, 
          sessionCount, 
          sessionPrice, 
          totalAmount, 
          startDate, 
          endDate, 
          notes 
        } = req.body;
        
        const student = await Student.findById(studentId);
        if (!student) {
          return res.status(404).json({ 
            success: false,
            error: 'الطالب غير موجود' 
          });
        }
        
        if (classId) {
          const classObj = await Class.findById(classId);
          if (!classObj) {
            return res.status(404).json({ 
              success: false,
              error: 'الحصة غير موجودة' 
            });
          }
          
          const isEnrolled = classObj.students.includes(studentId);
          if (!isEnrolled) {
            return res.status(400).json({ 
              success: false,
              error: 'الطالب غير مسجل في هذه الحصة' 
            });
          }
        }
        
        // Create round payment
        const roundPayment = new RoundPayment({
          student: studentId,
          class: classId || null,
          roundNumber: roundNumber || `RND-${Date.now().toString().slice(-6)}`,
          sessionCount,
          sessionPrice,
          totalAmount,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: 'pending',
          recordedBy: req.user.id,
          notes: notes,
          sessions: []
        });
        
        // Generate sessions
        const sessions = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysBetween = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));
        const interval = Math.floor(daysBetween / (sessionCount - 1));
        
        for (let i = 0; i < sessionCount; i++) {
          const sessionDate = new Date(start);
          sessionDate.setDate(start.getDate() + (i * interval));
          
          sessions.push({
            sessionNumber: i + 1,
            date: sessionDate,
            status: 'pending',
            price: sessionPrice
          });
        }
        
        roundPayment.sessions = sessions;
        await roundPayment.save();
        
        // Create a payment record for the round
        const payment = new Payment({
          student: studentId,
          class: classId || null,
          amount: totalAmount,
          month: `جولة ${roundPayment.roundNumber}`,
          monthCode: new Date().toISOString().slice(0, 7),
          status: 'pending',
          recordedBy: req.user.id,
          notes: `دفعة الجولة ${roundPayment.roundNumber} - ${notes || ''}`
        });
        
        await payment.save();
        
        res.status(201).json({
          success: true,
          message: 'تم إنشاء نظام الجولات بنجاح',
          data: {
            roundPayment,
            payment
          }
        });
      } catch (err) {
        console.error('Error creating round payment:', err);
        res.status(500).json({ 
          success: false,
          error: err.message 
        });
      }
    });
    
    
  // إضافة نقطة نهاية لدفع عمولة محددة
  app.post('/api/accounting/teacher-commissions/:id/pay',  async (req, res) => {
    try {
      const { paymentMethod, paymentDate } = req.body;
      
      const commission = await TeacherCommission.findById(req.params.id)
        .populate('teacher')
        .populate('student')
        .populate('class');

      if (!commission) {
        return res.status(404).json({ error: 'العمولة غير موجودة' });
      }

      if (commission.status === 'paid') {
        return res.status(400).json({ error: 'تم دفع العمولة مسبقاً' });
      }

      commission.status = 'paid';
      commission.paymentDate = paymentDate || new Date();
      commission.paymentMethod = paymentMethod || 'cash';
      commission.recordedBy = req.user.id;

      await commission.save();

      // تسجيل المعاملة المالية (مصروف)
      const expense = new Expense({
        description: `عمولة الأستاذ ${commission.teacher.name} عن الطالب ${commission.student.name} لشهر ${commission.month}`,
        amount: commission.amount,
        category: 'salary',
        type: 'teacher_payment',
        recipient: {
          type: 'teacher',
          id: commission.teacher._id,
          name: commission.teacher.name
        },
        paymentMethod: commission.paymentMethod,
        status: 'paid',
        recordedBy: req.user.id
      });

      await expense.save();

      res.json({
        message: 'تم دفع العمولة بنجاح',
        commission
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

    // Employee Management Routes
    // Get all staff members (employees)
    app.get('/api/employees', async (req, res) => {
    try {
      const employees = await User.find({ 
        role: { $in: ['admin', 'secretary', 'accountant'] } 
      }).select('-password');
      res.json(employees);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    });

    // Add new employee
    app.post('/api/employees', async (req, res) => {
    try {
      const { username, password, role, fullName, phone, email } = req.body;
      
      if (!['admin', 'secretary', 'accountant'].includes(role)) {
        return res.status(400).json({ error: 'الدور غير صالح للموظف' });
      }

      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'اسم المستخدم موجود مسبقا' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        username,
        password: hashedPassword,
        role,
        fullName,
        phone,
        email
      });

      await user.save();

      res.status(201).json({
        _id: user._id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        phone: user.phone,
        email: user.email
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
    });
    // Expense categories
    const EXPENSE_CATEGORIES = [
    'rent', 'utilities', 'supplies', 'maintenance', 
    'marketing', 'salaries', 'other'
    ];

    // Get expense categories
    app.get('/api/accounting/expense-categories',  (req, res) => {
    res.json(EXPENSE_CATEGORIES);
    });


  // 3. الحصول على دخل شهري + مصاريف + صافي الربح
  app.get('/api/accounting/monthly-financial-report',  async (req, res) => {
    try {
      const { month, year, startDate, endDate } = req.query;
      
      let dateRange = {};
      
      if (month && year) {
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0);
        dateRange = { $gte: start, $lte: end };
      } else if (startDate && endDate) {
        dateRange = { $gte: new Date(startDate), $lte: new Date(endDate) };
      } else {
        // افتراضي: الشهر الحالي
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        dateRange = { $gte: start, $lte: end };
      }

      // 1. حساب الإيرادات
      const incomeSources = {
        // مدفوعات الحصص
        classPayments: await Payment.aggregate([
          {
            $match: {
              paymentDate: dateRange,
              status: 'paid'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]),
        
        // رسوم التسجيل
        registrationFees: await SchoolFee.aggregate([
          {
            $match: {
              paymentDate: dateRange,
              status: 'paid'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]),
        
        // إيرادات أخرى
        otherIncome: await FinancialTransaction.aggregate([
          {
            $match: {
              date: dateRange,
              type: 'income',
              category: { $nin: ['tuition', 'registration'] }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ])
      };

      const totalIncome = 
        (incomeSources.classPayments[0]?.total || 0) +
        (incomeSources.registrationFees[0]?.total || 0) +
        (incomeSources.otherIncome[0]?.total || 0);

      // 2. حساب المصروفات
      const expenseCategories = {
        // رواتب الأساتذة
        teacherSalaries: await Expense.aggregate([
          {
            $match: {
              date: dateRange,
              category: 'salary',
              type: 'teacher_payment',
              status: 'paid'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]),
        
        // رواتب الموظفين
        staffSalaries: await Expense.aggregate([
          {
            $match: {
              date: dateRange,
              category: 'salary',
              type: { $ne: 'teacher_payment' },
              status: 'paid'
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ]),
        
        // مصروفات تشغيلية
        operational: await Expense.aggregate([
          {
            $match: {
              date: dateRange,
              category: { $nin: ['salary'] },
              status: 'paid'
            }
          },
          {
            $group: {
              _id: '$category',
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ])
      };

      const totalExpenses = 
        (expenseCategories.teacherSalaries[0]?.total || 0) +
        (expenseCategories.staffSalaries[0]?.total || 0) +
        expenseCategories.operational.reduce((sum, item) => sum + (item.total || 0), 0);

      // 3. حساب صافي الربح
      const netProfit = totalIncome - totalExpenses;

      // 4. تفاصيل إضافية
      const incomeDetails = await FinancialTransaction.find({
        date: dateRange,
        type: 'income'
      })
      .populate('recordedBy')
      .populate('student')
      .sort({ date: -1 })
      .limit(50);

      const expenseDetails = await Expense.find({
        date: dateRange,
        status: 'paid'
      })
      .populate('recordedBy')
      .sort({ date: -1 })
      .limit(50);

      res.json({
        period: dateRange,
        income: {
          total: totalIncome,
          breakdown: {
            classPayments: incomeSources.classPayments[0] || { total: 0, count: 0 },
            registrationFees: incomeSources.registrationFees[0] || { total: 0, count: 0 },
            otherIncome: incomeSources.otherIncome[0] || { total: 0, count: 0 }
          },
          details: incomeDetails
        },
        expenses: {
          total: totalExpenses,
          breakdown: {
            teacherSalaries: expenseCategories.teacherSalaries[0] || { total: 0, count: 0 },
            staffSalaries: expenseCategories.staffSalaries[0] || { total: 0, count: 0 },
            operational: expenseCategories.operational
          },
          details: expenseDetails
        },
        profit: {
          netProfit: netProfit,
          profitMargin: totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : 0
        },
        summary: {
          incomeTransactions: incomeDetails.length,
          expenseTransactions: expenseDetails.length,
          averageDailyIncome: calculateAverageDaily(incomeDetails, dateRange),
          averageDailyExpense: calculateAverageDaily(expenseDetails, dateRange)
        }
      });

    } catch (err) {
      console.error('Error generating financial report:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 4. تفاصيل رسوم التسجيل
  app.get('/api/accounting/registration-fee-details',  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const query = {};

      if (startDate || endDate) {
        query.paymentDate = {};
        if (startDate) query.paymentDate.$gte = new Date(startDate);
        if (endDate) query.paymentDate.$lte = new Date(endDate);
      }

      const fees = await SchoolFee.find(query)
        .populate('student')
        .populate('recordedBy')
        .sort({ paymentDate: -1 });

      res.json(fees);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. إحصائيات مالية سريعة
  app.get('/api/accounting/quick-financial-stats',  async (req, res) => {
    try {
      // الشهر الحالي
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      // إجمالي الإيرادات
      const incomeResult = await FinancialTransaction.aggregate([
        {
          $match: {
            type: 'income',
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      // إجمالي المصروفات
      const expenseResult = await Expense.aggregate([
        {
          $match: {
            status: 'paid',
            date: { $gte: startOfMonth, $lte: endOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      // المدفوعات المعلقة
      const pendingCount = await Payment.countDocuments({ 
        status: 'pending',
        month: now.toISOString().slice(0, 7)
      });

      res.json({
        totalIncome: incomeResult[0]?.total || 0,
        totalExpenses: expenseResult[0]?.total || 0,
        pendingPayments: pendingCount,
        lastUpdated: new Date()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // ==============================================
  // دوال مساعدة
  // ==============================================

  // دالة للحصول على نطاق تاريخ الشهر
  function getMonthDateRange(monthString) {
    const [year, month] = monthString.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return {
      $gte: startDate,
      $lte: endDate
    };
  }

  // دالة لحساب متوسط القيم اليومية
  function calculateAverageDaily(transactions, dateRange) {
    if (!transactions || transactions.length === 0) return 0;
    
    const start = new Date(dateRange.$gte);
    const end = new Date(dateRange.$lte);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;
    
    const total = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    return Math.round(total / days);
  }



  // 4. تصدير تقرير مالي
  app.get('/api/accounting/export-financial-report', async (req, res) => {
    try {
      const { format, month, year, startDate, endDate } = req.query;
      
      // الحصول على البيانات
      const report = await getFinancialReportData(month, year, startDate, endDate);
      
      if (format === 'excel') {
        // إنشاء ملف Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('التقرير المالي');
        
        // إضافة البيانات إلى Excel
        await generateExcelReport(worksheet, report);
        
        // إعداد الاستجابة
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=financial-report.xlsx');
        
        await workbook.xlsx.write(res);
        res.end();
        
      } else if (format === 'pdf') {
        // إنشاء ملف PDF (سيتطلب مكتبة مثل pdfkit)
        // يمكنك إضافة هذا لاحقاً
        res.status(501).json({ error: 'تصدير PDF غير متاح حالياً' });
      } else {
        res.json(report);
      }
      
    } catch (err) {
      console.error('Error exporting report:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // ==============================================
  // دوال مساعدة
  // ==============================================

  // دالة لحساب العمولة
  async function calculateClassCommission(teacherId, classId, month) {
    try {
      const teacher = await Teacher.findById(teacherId);
      const classObj = await Class.findById(classId).populate('students');
      
      if (!teacher || !classObj) {
        return { error: 'الأستاذ أو الحصة غير موجودة' };
      }

      // حساب عدد الحصص الشهري
      const weeklySessions = classObj.schedule.length;
      const totalMonthlySessions = weeklySessions * 4; // 4 أسابيع في الشهر
      
      const students = classObj.students;
      const totalClassRevenue = classObj.price;
      const studentMonthlyFee = totalClassRevenue / students.length;
      const totalTeacherCommission = totalClassRevenue * 0.7;

      return {
        data: {
          teacher,
          class: classObj,
          month,
          students: students.map(student => ({
            student,
            monthlyFee: studentMonthlyFee,
            teacherShare: studentMonthlyFee * 0.7
          })),
          summary: {
            totalStudents: students.length,
            totalClassRevenue,
            totalTeacherCommission
          }
        }
      };
    } catch (err) {
      return { error: err.message };
    }
  }

  // دالة لحساب متوسط القيم اليومية
  function calculateAverageDaily(transactions, dateRange) {
    if (!transactions.length) return 0;
    
    const start = new Date(dateRange.$gte);
    const end = new Date(dateRange.$lte);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1;
    
    const total = transactions.reduce((sum, t) => sum + t.amount, 0);
    return total / days;
  }

  // دالة لإنشاء تقرير Excel
  async function generateExcelReport(worksheet, report) {
    // إضافة العناوين
    worksheet.columns = [
      { header: 'التاريخ', key: 'date', width: 15 },
      { header: 'النوع', key: 'type', width: 15 },
      { header: 'الوصف', key: 'description', width: 40 },
      { header: 'المبلغ', key: 'amount', width: 15 },
      { header: 'التصنيف', key: 'category', width: 20 },
      { header: 'الملاحظات', key: 'notes', width: 30 }
    ];

    // إضافة بيانات الإيرادات
    worksheet.addRow({ description: '=== الإيرادات ===' });
    report.income.details.forEach(item => {
      worksheet.addRow({
        date: new Date(item.date).toLocaleDateString('ar-EG'),
        type: 'إيراد',
        description: item.description,
        amount: item.amount,
        category: item.category,
        notes: item.notes || ''
      });
    });

    // إضافة بيانات المصروفات
    worksheet.addRow({ description: '=== المصروفات ===' });
    report.expenses.details.forEach(item => {
      worksheet.addRow({
        date: new Date(item.date).toLocaleDateString('ar-EG'),
        type: 'مصروف',
        description: item.description,
        amount: item.amount,
        category: item.category,
        notes: item.notes || ''
      });
    });

    // إضافة الملخص
    worksheet.addRow({ description: '=== الملخص ===' });
    worksheet.addRow({ description: 'إجمالي الإيرادات', amount: report.income.total });
    worksheet.addRow({ description: 'إجمالي المصروفات', amount: report.expenses.total });
    worksheet.addRow({ description: 'صافي الربح', amount: report.profit.netProfit });
  }

  // دالة للحصول على نطاق تاريخ الشهر
  function getMonthDateRange(monthString) {
    const [year, month] = monthString.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    return {
      $gte: startDate,
      $lte: endDate
    };
  }

  // دالة لحساب عدد الحصص الإجمالي
  function calculateTotalSessions(weeklySessions, monthString) {
    // 4 أسابيع في الشهر كتقريب
    return weeklySessions * 4;
  }

  // دالة للحصول على فترة الجولة
  async function getRoundPeriod(roundId) {
    // يمكنك توسيع هذه الدالة للحصول على بيانات الجولة من قاعدة البيانات
    return {
      month: new Date().toISOString().slice(0, 7),
      startDate: new Date(),
      endDate: new Date()
    };
  }

// POST /api/accounting/teacher-commissions/pay - متوافق مع الواجهة الحالية
app.post('/api/accounting/teacher-commissions/pay', async (req, res) => {
  try {
    const { commissionId, paymentMethod, paymentDate, notes } = req.body;
    
    console.log(`💰 دفع العمولة: ${commissionId}`);

    if (!commissionId) {
      return res.status(400).json({
        success: false,
        error: 'معرف العمولة مطلوب'
      });
    }

    // جلب العمولة
    const commission = await TeacherCommission.findById(commissionId)
      .populate('teacher', 'name phone email')
      .populate('class', 'name subject');

    if (!commission) {
      return res.status(404).json({
        success: false,
        error: 'العمولة غير موجودة'
      });
    }

    if (commission.status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'العمولة مسددة مسبقاً'
      });
    }

    const paymentDateObj = paymentDate ? new Date(paymentDate) : new Date();

    // ==============================================
    // 🔥 تحديث جميع الطلاب في العمولة إلى مدفوع
    // ==============================================
    let totalPaidAmount = 0;
    const updatedStudents = [];

    for (const student of commission.students) {
      if (student.status !== 'paid' && student.isActive !== false) {
        student.status = 'paid';
        student.paymentDate = paymentDateObj;
        student.paymentMethod = paymentMethod || 'cash';
        student.receiptNumber = `COMM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        totalPaidAmount += student.teacherShare || 0;
        updatedStudents.push(student.student);
        
        // تحديث الدفعة المرتبطة بالطالب
        const payment = await Payment.findOne({
          student: student.student,
          class: commission.class,
          monthCode: commission.month,
          commissionId: commission._id
        });

        if (payment && payment.status !== 'paid') {
          payment.status = 'paid';
          payment.paymentDate = paymentDateObj;
          payment.paymentMethod = paymentMethod || 'cash';
          payment.invoiceNumber = student.receiptNumber;
          await payment.save();
        }
      }
    }

    // تحديث إجماليات العمولة
    commission.totalPaid = commission.totalAmount;
    commission.remainingAmount = 0;
    commission.status = 'paid';
    
    commission.paymentHistory.push({
      amount: commission.totalAmount,
      paymentDate: paymentDateObj,
      paymentMethod: paymentMethod || 'cash',
      receiptNumber: `COMM-${Date.now()}`,
      month: commission.month,
      recordedBy: req.user?.id || null,
      notes: notes || 'دفعة جولة كاملة'
    });

    await commission.save();

    // تسجيل المعاملة المالية (مصروف)
    const expense = new Expense({
      schoolId: commission.schoolId,
      description: `راتب الأستاذ ${commission.teacher?.name || 'غير معروف'} عن شهر ${commission.month}`,
      amount: commission.totalAmount,
      category: 'salary',
      type: 'teacher_payment',
      paymentMethod: paymentMethod || 'cash',
      status: 'paid',
      recordedBy: req.user?.id || null,
      date: paymentDateObj,
      receiptNumber: `EXP-${Date.now()}`
    });
    await expense.save();

    // جلب البيانات المحدثة (بنفس تنسيق الواجهة الحالية)
    const updatedCommission = await TeacherCommission.findById(commissionId)
      .populate('teacher', 'name phone email')
      .populate('class', 'name subject')
      .populate('students.student', 'name studentId');

    // إرجاع الاستجابة بنفس تنسيق الواجهة الحالية
    res.json({
      success: true,
      message: `تم دفع العمولة بنجاح بقيمة ${commission.totalAmount.toLocaleString()} د.ج`,
      commission: updatedCommission,
      receiptNumber: commission.paymentHistory[commission.paymentHistory.length - 1]?.receiptNumber,
      // إضافة معلومات إضافية (لن تؤثر على الواجهة الحالية)
      _expenseId: expense._id,
      _studentsUpdated: updatedStudents.length
    });

  } catch (err) {
    console.error('❌ خطأ في دفع العمولة:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

// ==============================================
// ✅ نقطة نهاية لجلب تفاصيل عمولة أستاذ مع تفاصيل الطلاب
// ==============================================


// ==============================================
// ✅ نقطة نهاية لتحديث حصة الطالب في العمولة
// ==============================================


// ==============================================
// ✅ نقطة نهاية لتحديث حضور طالب في يوم معين للعمولة
// ==============================================

  // نقطة نهاية جديدة للحصول على العمولات مجمعة حسب الحصة
  app.get('/api/accounting/teacher-commissions-by-class',  async (req, res) => {
    try {
        const { teacher, month, status, class: classId } = req.query;
        const matchStage = {};
        
        if (teacher) matchStage.teacher = new mongoose.Types.ObjectId(teacher);
        if (month) matchStage.month = month;
        if (status) matchStage.status = status;
        if (classId) matchStage.class = new mongoose.Types.ObjectId(classId);
        
        const commissionsByClass = await TeacherCommission.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        teacher: '$teacher',
                        class: '$class',
                        month: '$month'
                    },
                    commissions: { $push: '$$ROOT' },
                    totalAmount: { $sum: '$amount' }
                }
            },
            {
                $lookup: {
                    from: 'teachers',
                    localField: '_id.teacher',
                    foreignField: '_id',
                    as: 'teacher'
                }
            },
            {
                $lookup: {
                    from: 'classes',
                    localField: '_id.class',
                    foreignField: '_id',
                    as: 'class'
                }
            },
            {
                $lookup: {
                    from: 'students',
                    localField: 'commissions.student',
                    foreignField: '_id',
                    as: 'studentDetails'
                }
            },
            {
                $project: {
                    'teacher': { $arrayElemAt: ['$teacher', 0] },
                    'class': { $arrayElemAt: ['$class', 0] },
                    'month': '$_id.month',
                    'commissions': {
                        $map: {
                            input: '$commissions',
                            as: 'commission',
                            in: {
                                _id: '$$commission._id',
                                student: {
                                    $arrayElemAt: [
                                        {
                                            $filter: {
                                                input: '$studentDetails',
                                                as: 'student',
                                                cond: { $eq: ['$$student._id', '$$commission.student'] }
                                            }
                                        },
                                        0
                                    ]
                                },
                                amount: '$$commission.amount',
                                percentage: '$$commission.percentage',
                                status: '$$commission.status',
                                paymentDate: '$$commission.paymentDate'
                            }
                        }
                    },
                    'totalAmount': 1
                }
            }
        ]);
        
        res.json(commissionsByClass);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  });

  // نقطة نهاية لدفع عمولة حصة محددة
  app.post('/api/accounting/teacher-commissions/pay-by-class',  async (req, res) => {
    try {
      const { teacherId, classId, month, paymentMethod, paymentDate, percentage } = req.body;
      
      // البحث عن العمولات المعلقة للأستاذ والحصة والشهر المحددين
      const commissions = await TeacherCommission.find({
        teacher: teacherId,
        class: classId,
        month: month,
        status: 'pending'
      }).populate('student teacher class');
      
      if (commissions.length === 0) {
        return res.status(404).json({ 
          success: false,
          error: 'لا توجد عمولات معلقة لهذا الأستاذ في هذه الحصة لهذا الشهر' 
        });
      }
      
      let totalAmount = 0;
      const paidCommissions = [];
      
      // دفع كل عمولة على حدة مع تطبيق النسبة المحددة
      for (const commission of commissions) {
        // إعادة حساب مبلغ العمولة بناءً على النسبة الجديدة إذا تم تغييرها
        const originalPayment = await Payment.findOne({
          student: commission.student._id,
          class: commission.class._id,
          month: commission.month
        });
        
        let commissionAmount = commission.amount;
        if (percentage && percentage != commission.percentage) {
          // إعادة حساب العمولة بناءً على النسبة الجديدة
          commissionAmount = originalPayment.amount * (percentage / 100);
          commission.amount = commissionAmount;
          commission.percentage = percentage;
        }
        
        totalAmount += commissionAmount;
        
        // تحديث حالة العمولة إلى مدفوعة
        commission.status = 'paid';
        commission.paymentDate = paymentDate || new Date();
        commission.paymentMethod = paymentMethod || 'cash';
        commission.recordedBy = req.user.id;
        await commission.save();
        
        // تسجيل المعاملة المالية (مصروف)
        const expense = new Expense({
          description: `عمولة الأستاذ ${commission.teacher.name} عن الطالب ${commission.student.name} لحصة ${commission.class.name} لشهر ${commission.month}`,
          amount: commissionAmount,
          category: 'salary',
          type: 'teacher_payment',
          recipient: {
            type: 'teacher',
            id: commission.teacher._id,
            name: commission.teacher.name
          },
          paymentMethod: paymentMethod || 'cash',
          status: 'paid',
          recordedBy: req.user.id
        });
        await expense.save();
        
        paidCommissions.push({
          student: commission.student.name,
          amount: commissionAmount,
          originalAmount: originalPayment.amount
        });
      }
      
      res.json({
        success: true,
        message: `تم دفع عمولة الحصة بنجاح بقيمة ${totalAmount.toLocaleString()} د.ج`,
        totalAmount,
        month: month,
        paidCommissions,
        count: commissions.length
      });
    } catch (err) {
      console.error('Error paying by class:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });
  
  

    app.get('/api/accounting/reports/financial',  async (req, res) => {
      try {
        const { startDate, endDate, type } = req.query;
        const matchStage = {};
        
        if (startDate || endDate) {
          matchStage.date = {};
          if (startDate) matchStage.date.$gte = new Date(startDate);
          if (endDate) matchStage.date.$lte = new Date(endDate);
        }
        
        if (type) matchStage.type = type;

        // إيرادات (مدفوعات الطلاب)
        const revenueReport = await Payment.aggregate([
          { 
            $match: { 
              status: 'paid',
              paymentDate: matchStage.date || { $exists: true }
            } 
          },
          {
            $group: {
              _id: {
                year: { $year: '$paymentDate' },
                month: { $month: '$paymentDate' },
                day: { $dayOfMonth: '$paymentDate' }
              },
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // مصروفات
        const expensesReport = await Expense.aggregate([
          { 
            $match: { 
              status: 'paid',
              date: matchStage.date || { $exists: true }
            } 
          },
          {
            $group: {
              _id: {
                year: { $year: '$date' },
                month: { $month: '$date' },
                day: { $dayOfMonth: '$date' },
                category: '$category'
              },
              totalAmount: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        // الرصيد الحالي
        const currentBalance = await calculateCurrentBalance();

        res.json({
          revenue: revenueReport,
          expenses: expensesReport,
          currentBalance,
          period: {
            startDate: startDate || await getFirstRecordDate(),
            endDate: endDate || new Date()
          }
        });
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    });


    // Fix the balance calculation function
    async function calculateCurrentBalance() {
      try {
        // Get all transactions (both income and expenses)
        const transactions = await FinancialTransaction.aggregate([
          {
            $group: {
              _id: null,
              total: {
                $sum: {
                  $cond: [
                    { $eq: ["$type", "income"] },
                    "$amount",
                    { $multiply: ["$amount", -1] }
                  ]
                }
              }
            }
          }
        ]);
        
        return transactions[0]?.total || 0;
      } catch (err) {
        console.error('Error calculating balance:', err);
        return 0;
      }
    }

    async function updateTotalBalance(amount) {
      // في نظام حقيقي، قد نريد تخزين الرصيد في collection منفصل
      // للتبسيط، سنحسب الرصيد عند الطلب فقط
      console.log(`Updating balance by: ${amount}`);
    }

    async function getFirstRecordDate() {
      const firstPayment = await Payment.findOne().sort({ paymentDate: 1 });
      const firstExpense = await Expense.findOne().sort({ date: 1 });
      const firstBudget = await Budget.findOne().sort({ date: 1 });
      
      const dates = [];
      if (firstPayment) dates.push(new Date(firstPayment.paymentDate));
      if (firstExpense) dates.push(new Date(firstExpense.date));
      if (firstBudget) dates.push(new Date(firstBudget.date));
      
      return dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
    }
    // Monthly expense report
    app.get('/api/accounting/expense-report',  async (req, res) => {
    try {
      const { year, month } = req.query;
      
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      const expenses = await Expense.aggregate([
        {
          $match: {
            date: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);
      
      const totalExpenses = expenses.reduce((sum, item) => sum + item.total, 0);
      
      res.json({
        expenses,
        totalExpenses,
        period: `${year}-${month.toString().padStart(2, '0')}`
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    });

    // Financial dashboard data
    app.get('/api/accounting/dashboard',  async (req, res) => {
    try {
      const { year } = req.query;
      const currentYear = year || new Date().getFullYear();
      
      // Monthly income
      const monthlyIncome = await FinancialTransaction.aggregate([
        {
          $match: {
            type: 'income',
            date: {
              $gte: new Date(`${currentYear}-01-01`),
              $lte: new Date(`${currentYear}-12-31`)
            }
          }
        },
        {
          $group: {
            _id: { $month: '$date' },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { '_id': 1 } }
      ]);
      
      // Monthly expenses
      const monthlyExpenses = await FinancialTransaction.aggregate([
        {
          $match: {
            type: 'expense',
            date: {
              $gte: new Date(`${currentYear}-01-01`),
              $lte: new Date(`${currentYear}-12-31`)
            }
          }
        },
        {
          $group: {
            _id: { $month: '$date' },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { '_id': 1 } }
      ]);
      
      // Expense by category
      const expensesByCategory = await FinancialTransaction.aggregate([
        {
          $match: {
            type: 'expense',
            date: {
              $gte: new Date(`${currentYear}-01-01`),
              $lte: new Date(`${currentYear}-12-31`)
            }
          }
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' }
          }
        }
      ]);
      
      // Current month summary
      const currentMonth = new Date().getMonth() + 1;
      const currentMonthIncome = monthlyIncome.find(m => m._id === currentMonth)?.total || 0;
      const currentMonthExpenses = monthlyExpenses.find(m => m._id === currentMonth)?.total || 0;
      
      res.json({
        monthlyIncome,
        monthlyExpenses,
        expensesByCategory,
        currentMonthSummary: {
          income: currentMonthIncome,
          expenses: currentMonthExpenses,
          profit: currentMonthIncome - currentMonthExpenses
        },
        year: currentYear
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    });




    

    // ==============================================
    // Accounting Routes
    // ==============================================

    // School Fees (Registration Fees)
    app.get('/api/accounting/school-fees',  async (req, res) => {
    try {
      const { status, student } = req.query;
      const query = {};

      if (status) query.status = status;
      if (student) query.student = student;

      const fees = await SchoolFee.find(query)
        .populate('student')
        .populate('recordedBy')
        .sort({ paymentDate: -1 });

      res.json(fees);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    });

    app.post('/api/accounting/school-fees',  async (req, res) => {
    try {
      const { studentId } = req.body;
      
      // Check if student exists
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: 'الطالب غير موجود' });
      }

      // Check if fee already paid
      const existingFee = await SchoolFee.findOne({ student: studentId, status: 'paid' });
      if (existingFee) {
        return res.status(400).json({ error: 'تم دفع رسوم التسجيل مسبقاً لهذا الطالب' });
      }

      const fee = new SchoolFee({
        student: studentId,
        amount: 60, // 60 DZD
        recordedBy: req.user.id
      });

      await fee.save();

      res.status(201).json(fee);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
    });

  // في نقطة نهاية دفع رسوم التسجيل (/api/accounting/school-fees/:id/pay)
  app.put('/api/accounting/school-fees/:id/pay',  async (req, res) => {
    try {
      const fee = await SchoolFee.findById(req.params.id).populate('student');
      if (!fee) {
        return res.status(404).json({ error: 'رسوم التسجيل غير موجودة' });
      }

      fee.status = 'paid';
      fee.paymentDate = req.body.paymentDate || new Date();
      fee.paymentMethod = req.body.paymentMethod || 'cash';
      fee.invoiceNumber = `INV-SF-${Date.now()}`;
      fee.recordedBy = req.user.id;

      await fee.save();

      // إنشاء فاتورة
      const invoice = new Invoice({
        invoiceNumber: fee.invoiceNumber,
        type: 'school-fee',
        recipient: {
          type: 'student',
          id: fee.student._id,
          name: fee.student.name
        },
        items: [{
          description: 'رسوم تسجيل الطالب',
          amount: fee.amount,
          quantity: 1
        }],
        totalAmount: fee.amount,
        status: 'paid',
        paymentMethod: fee.paymentMethod,
        recordedBy: req.user.id
      });
      await invoice.save();

      // تسجيل المعاملة المالية - هذا هو الجزء الأهم
      const transaction = new FinancialTransaction({
        type: 'income', // يجب أن تكون من نوع income (إيراد)
        amount: fee.amount,
        description: `رسوم تسجيل الطالب ${fee.student.name}`,
        category: 'registration', // تأكد من أن هذا التصنيف موجود
        recordedBy: req.user.id,
        reference: fee._id,
        date: fee.paymentDate // تأكد من وجود تاريخ للمعاملة
      });
      await transaction.save();

      res.json({
        message: 'تم تسديد رسوم التسجيل بنجاح',
        fee,
        invoiceNumber: fee.invoiceNumber
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

app.post('/api/students/:id/pay-registration', async (req, res) => {
  try {

    const { amount, paymentDate, paymentMethod, notes } = req.body;
    const studentId = req.params.id;
  
    
    // ✅ Get schoolId from query or body
    const schoolId = req.query.schoolId || req.body.schoolId || req.user?.schoolId;
    
    console.log(`💰 Processing registration payment for student ${studentId}`);
    console.log(`🏫 School ID: ${schoolId}`);

    // ✅ Find student with school validation
    let query = { _id: studentId };
    if (schoolId) {
      query.schoolId = schoolId;
    }
    
    const student = await Student.findOne(query);
    if (!student) {
      return res.status(404).json({ 
        success: false,
        error: 'الطالب غير موجود أو لا ينتمي للمدرسة' 
      });
    }

    // Check if already paid
    if (student.hasPaidRegistration) {
      return res.status(400).json({
        success: false,
        error: 'رسوم التسجيل مدفوعة مسبقاً لهذا الطالب'
      });
    }

    // Update student payment status
    student.hasPaidRegistration = true;
    student.status = 'active';
    student.active = true;
    await student.save();

    // Create school fee record
    const schoolFee = new SchoolFee({
      student: studentId,
      amount: amount || 600,
      paymentDate: paymentDate || new Date(),
      paymentMethod: paymentMethod || 'cash',
      status: 'paid',
      invoiceNumber: `INV-SF-${Date.now()}`,
      recordedBy: req.user?.id || null,
      schoolId: schoolId // Add school reference
    });
    await schoolFee.save();

    // Record financial transaction
    const transaction = new FinancialTransaction({
      type: 'income',
      amount: amount || 600,
      description: `رسوم تسجيل الطالب ${student.name}`,
      category: 'registration',
      recordedBy: req.user?.id || null,
      reference: schoolFee._id,
      student: studentId,
      schoolId: schoolId // Add school reference
    });
    await transaction.save();

    console.log(`✅ Registration payment successful for ${student.name}`);

    res.json({
      success: true,
      message: 'تم دفع حقوق التسجيل بنجاح',
      student: {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
        hasPaidRegistration: student.hasPaidRegistration
      },
      receiptNumber: schoolFee.invoiceNumber,
      transactionId: transaction._id
    });

  } catch (err) {
    console.error('❌ Error processing registration payment:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});


// get todays transactions for school


// ==============================================
// ✅ TODAY'S TRANSACTIONS - Fixed
// ============================================


    // Teacher Payments (70% of class fees)
    app.get('/api/accounting/teacher-payments',  async (req, res) => {
    try {
      const { teacher, class: classId, student, month, status } = req.query;
      const query = {};

      if (teacher) query.teacher = teacher;
      if (classId) query.class = classId;
      if (student) query.student = student;
      if (month) query.month = month;
      if (status) query.status = status;

      const payments = await TeacherPayment.find(query)
        .populate('teacher')
        .populate('class')
        .populate('student')
        .populate('recordedBy')
        .sort({ month: -1 });

      res.json(payments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    });

    app.post('/api/accounting/teacher-payments',  async (req, res) => {
    try {
      const { teacherId, classId, studentId, month } = req.body;
      
      // Validate required fields
      if (!teacherId || !classId || !studentId || !month) {
        return res.status(400).json({ error: 'يجب إدخال جميع الحقول المطلوبة' });
      }

      // Check if payment already exists
      const existingPayment = await TeacherPayment.findOne({
        teacher: teacherId,
        class: classId,
        student: studentId,
        month
      });

      if (existingPayment) {
        return res.status(400).json({ error: 'تم تسجيل الدفع مسبقاً لهذا الأستاذ لهذا الشهر' });
      }

      // Get class to calculate teacher's share (70%)
      const classObj = await Class.findById(classId);
      if (!classObj) {
        return res.status(404).json({ error: 'الحصة غير موجودة' });
      }

      const teacherShare = classObj.price * 0.7;

      const payment = new TeacherPayment({
        teacher: teacherId,
        class: classId,
        student: studentId,
        month,
        amount: teacherShare,
        recordedBy: req.user.id
      });

      await payment.save();

      res.status(201).json(payment);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
    });

    app.put('/api/accounting/teacher-payments/:id/pay',  async (req, res) => {
    try {
      const payment = await TeacherPayment.findById(req.params.id)
        .populate('teacher')
        .populate('class')
        .populate('student');

      if (!payment) {
        return res.status(404).json({ error: 'الدفع غير موجود' });
      }

      payment.status = 'paid';
      payment.paymentDate = req.body.paymentDate || new Date();
      payment.paymentMethod = req.body.paymentMethod || 'cash';
      payment.invoiceNumber = `INV-TP-${Date.now()}`;
      payment.recordedBy = req.user.id;

      await payment.save();

      // Create invoice
      const invoice = new Invoice({
        invoiceNumber: payment.invoiceNumber,
        type: 'teacher',
        recipient: {
          type: 'teacher',
          id: payment.teacher._id,
          name: payment.teacher.name
        },
        items: [{
          description: `حصة الأستاذ من دفعة الطالب ${payment.student.name} لحصة ${payment.class.name} لشهر ${payment.month}`,
          amount: payment.amount,
          quantity: 1
        }],
        totalAmount: payment.amount,
        status: 'paid',
        paymentMethod: payment.paymentMethod,
        recordedBy: req.user.id
      });
      await invoice.save();

      // Record financial transaction (expense - teacher salary)
      const transaction = new FinancialTransaction({
        type: 'expense',
        amount: payment.amount,
        description: `حصة الأستاذ ${payment.teacher.name} من دفعة الطالب ${payment.student.name} لشهر ${payment.month}`,
        category: 'salary',
        recordedBy: req.user.id,
        reference: payment._id
      });
      await transaction.save();

      res.json({
        message: 'تم تسديد حصة الأستاذ بنجاح',
        payment,
        invoiceNumber: payment.invoiceNumber
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    });

    // Staff Salaries
    app.get('/api/accounting/staff-salaries',  async (req, res) => {
    try {
      const { employee, month, status } = req.query;
      const query = {};

      if (employee) query.employee = employee;
      if (month) query.month = month;
      if (status) query.status = status;

      const salaries = await StaffSalary.find(query)
        .populate('employee')
        .populate('recordedBy')
        .sort({ month: -1 });

      res.json(salaries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    });

    app.post('/api/accounting/staff-salaries',  async (req, res) => {
    try {
      const { employeeId, month, amount } = req.body;
      
      // Validate required fields
      if (!employeeId || !month || !amount) {
        return res.status(400).json({ error: 'يجب إدخال جميع الحقول المطلوبة' });
      }

      // Check if salary already exists for this month
      const existingSalary = await StaffSalary.findOne({
        employee: employeeId,
        month
      });

      if (existingSalary) {
        return res.status(400).json({ error: 'تم تسجيل الراتب مسبقاً لهذا الموظف لهذا الشهر' });
      }

      const salary = new StaffSalary({
        employee: employeeId,
        month,
        amount,
        recordedBy: req.user.id
      });

      await salary.save();

      res.status(201).json(salary);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
    });

    app.put('/api/accounting/staff-salaries/:id/pay',  async (req, res) => {
    try {
      const salary = await StaffSalary.findById(req.params.id)
        .populate('employee');

      if (!salary) {
        return res.status(404).json({ error: 'الراتب غير موجود' });
      }

      salary.status = 'paid';
      salary.paymentDate = req.body.paymentDate || new Date();
      salary.paymentMethod = req.body.paymentMethod || 'cash';
      salary.invoiceNumber = `INV-SS-${Date.now()}`;
      salary.recordedBy = req.user.id;

      await salary.save();

      // Create invoice
      const invoice = new Invoice({
        invoiceNumber: salary.invoiceNumber,
        type: 'staff',
        recipient: {
          type: 'staff',
          id: salary.employee._id,
          name: salary.employee.fullName
        },
        items: [{
          description: `راتب الموظف لشهر ${salary.month}`,
          amount: salary.amount,
          quantity: 1
        }],
        totalAmount: salary.amount,
        status: 'paid',
        paymentMethod: salary.paymentMethod,
        recordedBy: req.user.id
      });
      await invoice.save();

      // Record financial transaction (expense - staff salary)
      const transaction = new FinancialTransaction({
        type: 'expense',
        amount: salary.amount,
        description: `راتب الموظف ${salary.employee.fullName} لشهر ${salary.month}`,
        category: 'salary',
        recordedBy: req.user.id,
        reference: salary._id
      });
      await transaction.save();

      res.json({
        message: 'تم تسديد الراتب بنجاح',
        salary,
        invoiceNumber: salary.invoiceNumber
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    });




    // Invoices
    app.get('/api/accounting/invoices',  async (req, res) => {
    try {
      const { type, status, startDate, endDate } = req.query;
      const query = {};

      if (type) query.type = type;
      if (status) query.status = status;
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const invoices = await Invoice.find(query)
        .populate('recordedBy')
        .sort({ date: -1 });

      res.json(invoices);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    });



  // Students count endpoint
  app.get('/api/students/count', async (req, res) => {
    try {
        const count = await Student.countDocuments({ status: 'active' });
        res.json({ count, status: 'success' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to count students', status: 'error' });
    }
  });



  // Teachers count endpoint
  app.get('/api/teachers/count', async (req, res) => {
    try {
        const count = await Teacher.countDocuments({ active: true });
        res.json({ count, status: 'success' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to count teachers', status: 'error' });
    }
  });

  // Classes count endpoint
  // تأكد من أن هذا الكود موجود في نقطة /api/classes GET
  // app.get('/api/classes',  async (req, res) => {
  //   try {
  //     const { academicYear, subject, teacher } = req.query;
  //     const query = {};

  //     if (academicYear) query.academicYear = academicYear;
  //     if (subject) query.subject = subject;
  //     if (teacher) query.teacher = teacher;

  //     const classes = await Class.find(query)
  //       .populate('teacher')
  //       .populate('students')
  //       .populate('schedule.classroom')
  //       .sort({ createdAt: -1 });
  //     res.json(classes);
  //   } catch (err) {
  //     res.status(500).json({ error: err.message });
  //   }
  // });
  // Get all classes
// ==============================================
// 📚 جلب حصص المدرسة المحددة فقط - FIXED ✅
// ==============================================

// تأكد من أن هذا الكود موجود في server.js
// ==============================================
// 📚 GET CLASSES - Filtered by School ID
// ==============================================
// ==============================================
// 📚 GET CLASSES - Filtered by School ID
// ==============================================

  app.post('/api/accounting/transactions', async (req, res) => {
    try {
        const { type, amount, description, category, date, reference } = req.body;
        
        // Validate required fields
        if (!type || !amount || !description || !category) {
            return res.status(400).json({ error: 'يجب إدخال جميع الحقول المطلوبة' });
        }
        
        const transaction = new FinancialTransaction({
            type,
            amount,
            description,
            category,
            date,
            reference
        });
        
        await transaction.save();
        
        res.json({ message: 'Transaction added successfully', transaction });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  });

  // Add the missing transactions endpoint
  app.get('/api/accounting/transactions', async (req, res) => {
    try {
        const { limit = 1000, type, category, startDate, endDate } = req.query;
        const query = {};
        
        if (type) query.type = type;
        if (category) query.category = category;
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        
        const transactions = await FinancialTransaction.find(query)
            .populate('recordedBy')
            .populate('student')
            .sort({ date: -1 })
            .limit(parseInt(limit));
        
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  });

  // Add this test endpoint to check if there are any payments at all
  app.get('/api/accounting/test-payments', async (req, res) => {
    try {
      const allPayments = await Payment.find({ status: 'paid' })
        .populate('student')
        .limit(10);
      
      const count = await Payment.countDocuments({ status: 'paid' });
      
      res.json({
        totalPaidPayments: count,
        samplePayments: allPayments.map(p => ({
          id: p._id,
          amount: p.amount,
          paymentDate: p.paymentDate,
          student: p.student?.name,
          month: p.month
        }))
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // Add this to see what dates exist in your payments
  app.get('/api/accounting/payment-dates', async (req, res) => {
    try {
      const dates = await Payment.aggregate([
        { $match: { status: 'paid', paymentDate: { $ne: null } } },
        { 
          $group: {
            _id: {
              year: { $year: '$paymentDate' },
              month: { $month: '$paymentDate' },
              day: { $dayOfMonth: '$paymentDate' }
            },
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
        { $limit: 10 }
      ]);
      
      res.json(dates);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  // حساب مدخول اليوم
  // حساب مدخول اليوم - الإصدار المصحح
  app.get('/api/accounting/daily-income',  async (req, res) => {
    try {
      const { date } = req.query;
      
      // استخدام التاريخ المحدد أو تاريخ اليوم
      let targetDate;
      if (date) {
        targetDate = new Date(date);
      } else {
        targetDate = new Date();
      }
      
      // تعيين الوقت إلى بداية اليوم (00:00:00)
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      // تعيين الوقت إلى نهاية اليوم (23:59:59.999)
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(`بحث عن دخل يوم: ${startOfDay} إلى ${endOfDay}`);

      // 1. حساب مدفوعات الحصص اليومية
      const dailyPayments = await Payment.aggregate([
        {
          $match: {
            paymentDate: {
              $gte: startOfDay,
              $lte: endOfDay
            },
            status: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      // 2. حساب رسوم التسجيل المدفوعة اليوم
      const dailySchoolFees = await SchoolFee.aggregate([
        {
          $match: {
            paymentDate: {
              $gte: startOfDay,
              $lte: endOfDay
            },
            status: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      // 3. حساب الإيرادات الأخرى من المعاملات المالية
      const dailyTransactions = await FinancialTransaction.aggregate([
        {
          $match: {
            date: {
              $gte: startOfDay,
              $lte: endOfDay
            },
            type: 'income'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      // 4. حساب الإيرادات من الفواتير (إذا كنت تستخدم Invoice model)
      const dailyInvoices = await Invoice.aggregate([
        {
          $match: {
            date: {
              $gte: startOfDay,
              $lte: endOfDay
            },
            status: 'paid'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalAmount' },
            count: { $sum: 1 }
          }
        }
      ]);

      const paymentsTotal = dailyPayments[0]?.total || 0;
      const feesTotal = dailySchoolFees[0]?.total || 0;
      const otherIncomeTotal = dailyTransactions[0]?.total || 0;
      const invoicesTotal = dailyInvoices[0]?.total || 0;
      
      const totalIncome = paymentsTotal + feesTotal + otherIncomeTotal + invoicesTotal;

      // الحصول على تفاصيل إضافية للعرض
      const paymentDetails = await Payment.find({
        paymentDate: { $gte: startOfDay, $lte: endOfDay },
        status: 'paid' 
      })
      .populate('student', 'name studentId')
      .populate('class', 'name price')
      .populate('recordedBy', 'username fullName')
      .limit(20)
      .sort({ paymentDate: -1 });

      const feeDetails = await SchoolFee.find({
        paymentDate: { $gte: startOfDay, $lte: endOfDay },
        status: 'paid'
      })
      .populate('student', 'name studentId')
      .populate('recordedBy', 'username fullName')
      .limit(20)
      .sort({ paymentDate: -1 });

      // تحويل التاريخ إلى تنسيق عربي
      const arabicDate = new Intl.DateTimeFormat('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      }).format(targetDate);

      res.json({
        success: true,
        dailyIncome: totalIncome,
        date: startOfDay.toISOString().split('T')[0],
        formattedDate: arabicDate,
        breakdown: {
          payments: {
            amount: paymentsTotal,
            count: dailyPayments[0]?.count || 0,
            details: paymentDetails
          },
          registrationFees: {
            amount: feesTotal,
            count: dailySchoolFees[0]?.count || 0,
            details: feeDetails
          },
          otherIncome: {
            amount: otherIncomeTotal,
            count: dailyTransactions[0]?.count || 0
          },
          invoices: {
            amount: invoicesTotal,
            count: dailyInvoices[0]?.count || 0
          }
        },
        summary: {
          totalAmount: totalIncome,
          totalTransactions: (dailyPayments[0]?.count || 0) + 
                            (dailySchoolFees[0]?.count || 0) + 
                            (dailyTransactions[0]?.count || 0) +
                            (dailyInvoices[0]?.count || 0)
        },
        debug: {
          dateRange: {
            start: startOfDay,
            end: endOfDay
          },
          paymentsQueryResult: dailyPayments,
          feesQueryResult: dailySchoolFees,
          transactionsQueryResult: dailyTransactions
        }
      });

    } catch (err) {
      console.error('Error in daily-income endpoint:', err);
      res.status(500).json({ 
        success: false,
        error: err.message,
        dailyIncome: 0
      });
    }
  });




  app.get('/api/accounting/weekly-income',  async (req, res) => {
    try {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // الأحد كبداية الأسبوع
        
        const weeklyIncome = [];
        let totalWeeklyIncome = 0;
        
        // حساب الدخل لكل يوم من أيام الأسبوع
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + i);
            
            const dayIncome = await calculateDailyIncome(currentDate.toISOString().split('T')[0]);
            weeklyIncome.push({
                date: currentDate.toISOString().split('T')[0],
                dayName: currentDate.toLocaleDateString('ar-EG', { weekday: 'long' }),
                income: dayIncome.dailyIncome
            });
            
            totalWeeklyIncome += dayIncome.dailyIncome;
        }
        
        res.json({
            weeklyIncome,
            totalWeeklyIncome,
            startDate: startOfWeek.toISOString().split('T')[0],
            endDate: today.toISOString().split('T')[0]
        });
    } catch (error) {
        res.status(500).json({ error: 'فشل في حساب الدخل الأسبوعي' });
    }
  });

  // دالة إضافية للحصول على إحصائيات الدخل للشهر الحالي
  app.get('/api/accounting/monthly-income',  async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        // حساب الدخل الشهري
        const monthlyResult = await Payment.aggregate([
            {
                $match: {
                    paymentDate: {
                        $gte: startOfMonth,
                        $lte: endOfMonth
                    },
                    status: 'paid'
                }
            },
            {
                $group: {
                    _id: null,
                    totalPayments: { $sum: '$amount' }
                }
            }
        ]);
        
        const feesResult = await SchoolFee.aggregate([
            {
                $match: {
                    paymentDate: {
                        $gte: startOfMonth,
                        $lte: endOfMonth
                    },
                    status: 'paid'
                }
            },
            {
                $group: {
                    _id: null,
                    totalFees: { $sum: '$amount' }
                }
            }
        ]);
        
        const otherIncomeResult = await FinancialTransaction.aggregate([
            {
                $match: {
                    date: {
                        $gte: startOfMonth,
                        $lte: endOfMonth
                    },
                    type: 'income',
                    category: { $ne: 'tuition' }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOther: { $sum: '$amount' }
                }
            }
        ]);
        
        const totalMonthlyIncome = 
            (monthlyResult[0]?.totalPayments || 0) +
            (feesResult[0]?.totalFees || 0) +
            (otherIncomeResult[0]?.totalOther || 0);
        
        res.json({
            totalMonthlyIncome,
            payments: monthlyResult[0]?.totalPayments || 0,
            fees: feesResult[0]?.totalFees || 0,
            otherIncome: otherIncomeResult[0]?.totalOther || 0,
            month: today.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })
        });
    } catch (error) {
        res.status(500).json({ error: 'فشل في حساب الدخل الشهري' });
    }
  });


  // Health check endpoint
  app.get('/api/health', async (req, res) => {
    try {
        // Check database connection
        await mongoose.connection.db.admin().ping();
        
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            database: 'connected'
        });
    } catch (error) {
        res.status(500).json({ 
            status: 'ERROR', 
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: error.message 
        });
    }
  });
    const PORT = process.env.PORT || 4200;
    server.listen(PORT, () => {
    console.log(` server is working on : http://localhost:${PORT}`);
    });

    process.on('unhandledRejection', (reason, p) => {
    console.error('Unhandled Rejection at:', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
    });

    process.on('uncaughtException', (err, origin) => {
    console.error('Uncaught Exception at:', origin, 'error:', err);
    // application specific logging, throwing an error, or other logic here
    });

    process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error('Uncaught Exception Monitor at:', origin, 'error:', err);
    // application specific logging, throwing an error, or other logic here
    });

    process.on('unhandledRejectionMonitor', (reason, p) => {
    console.error('Unhandled Rejection Monitor at:', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
    });

    process.on('warning', (warning) => {
    console.error('Warning:', warning);
    // application specific logging, throwing an error, or other logic here
    });

  // Global error handling middleware
  app.use((error, req, res, next) => {
    console.error('Unhandled Error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  });

  // favicon.ico
  app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'assets', 'redox-icon.png'));

  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  }); 
  app.post('/api/payment-systems/monthly',  async (req, res) => {
    try {
      const { studentId, classId, startDate, monthlyAmount, totalMonths, autoGenerate, notes } = req.body;
      
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: 'الطالب غير موجود' });
      }
      
      // التحقق مما إذا كان الطالب مسجلاً في الحصة
      if (classId) {
        const classObj = await Class.findById(classId);
        if (!classObj) {
          return res.status(404).json({ error: 'الحصة غير موجودة' });
        }
        
        const isEnrolled = classObj.students.includes(studentId);
        if (!isEnrolled) {
          return res.status(400).json({ error: 'الطالب غير مسجل في هذه الحصة' });
        }
      }
      
      // إنشاء دفعات شهرية
      const payments = [];
      const start = new Date(startDate);
      
      for (let i = 0; i < totalMonths; i++) {
        const paymentDate = new Date(start);
        paymentDate.setMonth(start.getMonth() + i);
        
        const monthName = `${paymentDate.getFullYear()}-${(paymentDate.getMonth() + 1).toString().padStart(2, '0')}`;
        
        const payment = new Payment({
          student: studentId,
          class: classId || null,
          amount: monthlyAmount,
          month: monthName,
          status: paymentDate < new Date() ? 'pending' : 'pending',
          recordedBy: req.user.id,
          notes: notes
        });
        
        await payment.save();
        payments.push(payment);
      }
      
      res.status(201).json({
        message: `تم إنشاء ${totalMonths} دفعة شهرية بنجاح`,
        payments,
        totalAmount: monthlyAmount * totalMonths
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // إنشاء نظام جولات
  app.post('/api/payment-systems/rounds',  async (req, res) => {
    try {
      const { studentId, classId, roundNumber, sessionCount, sessionPrice, totalAmount, startDate, endDate, notes } = req.body;
      
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: 'الطالب غير موجود' });
      }
      
      if (classId) {
        const classObj = await Class.findById(classId);
        if (!classObj) {
          return res.status(404).json({ error: 'الحصة غير موجودة' });
        }
        
        const isEnrolled = classObj.students.includes(studentId);
        if (!isEnrolled) {
          return res.status(400).json({ error: 'الطالب غير مسجل في هذه الحصة' });
        }
      }
      
      // إنشاء نظام الجولات
      const roundPayment = new RoundPayment({
        student: studentId,
        class: classId || null,
        roundNumber: roundNumber || `RND-${Date.now().toString().slice(-6)}`,
        sessionCount,
        sessionPrice,
        totalAmount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: 'pending',
        recordedBy: req.user.id,
        notes: notes,
        sessions: []
      });
      
      // توليد الجلسات
      const sessions = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysBetween = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
      const interval = Math.floor(daysBetween / (sessionCount - 1));
      
      for (let i = 0; i < sessionCount; i++) {
        const sessionDate = new Date(start);
        sessionDate.setDate(start.getDate() + (i * interval));
        
        sessions.push({
          sessionNumber: i + 1,
          date: sessionDate,
          status: 'pending',
          price: sessionPrice
        });
      }
      
      roundPayment.sessions = sessions;
      await roundPayment.save();
      
      // إنشاء دفعة واحدة للجولة
      const payment = new Payment({
        student: studentId,
        class: classId || null,
        amount: totalAmount,
        month: `جولة ${roundPayment.roundNumber}`,
        status: 'pending',
        recordedBy: req.user.id,
        notes: `دفعة الجولة ${roundPayment.roundNumber} - ${notes}`
      });
      
      await payment.save();
      
      res.status(201).json({
        message: 'تم إنشاء نظام الجولات بنجاح',
        roundPayment,
        payment
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // دفع جولة
  app.put('/api/payment-systems/rounds/:id/pay',  async (req, res) => {
    try {
      const { paymentMethod, paymentDate, notes } = req.body;
      
      const roundPayment = await RoundPayment.findById(req.params.id)
        .populate('student')
        .populate('class');
      
      if (!roundPayment) {
        return res.status(404).json({ error: 'الجولة غير موجودة' });
      }
      
      // تحديث حالة الجولة
      roundPayment.status = 'paid';
      roundPayment.sessions.forEach(session => {
        session.status = 'completed';
      });
      
      await roundPayment.save();
      
      // تحديث الدفعة المرتبطة
      const payment = await Payment.findOne({
        student: roundPayment.student._id,
        month: `جولة ${roundPayment.roundNumber}`,
        amount: roundPayment.totalAmount
      });
      
      if (payment) {
        payment.status = 'paid';
        payment.paymentDate = new Date(paymentDate || new Date());
        payment.paymentMethod = paymentMethod || 'cash';
        payment.notes = notes || payment.notes;
        await payment.save();
      }
      
      // تسجيل المعاملة المالية
      const transaction = new FinancialTransaction({
        type: 'income',
        amount: roundPayment.totalAmount,
        description: `دفعة جولة ${roundPayment.roundNumber} للطالب ${roundPayment.student.name}`,
        category: 'tuition',
        recordedBy: req.user.id,
        reference: roundPayment._id
      });
      
      await transaction.save();
      
      res.json({
        message: 'تم دفع الجولة بنجاح',
        roundPayment,
        payment
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  // Get student classes
  // Get student classes - ADD THIS ENDPOINT
// ==============================================
// جلب حصص طالب معين
// ==============================================
app.get('/api/students/:id/classes', async (req, res) => {
  try {
    const studentId = req.params.id;
    const schoolId = req.user?.schoolId || req.query.schoolId;
    
    console.log(`📚 جلب حصص الطالب: ${studentId}`);
    console.log(`🏫 schoolId: ${schoolId}`);
    
    // التحقق من صحة المعرف
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        error: 'معرف الطالب غير صالح'
      });
    }

    // جلب الطالب مع حصصه
    const student = await Student.findOne({
      _id: studentId,
      ...(schoolId && { schoolId: schoolId })
    }).populate({
      path: 'classes',
      match: { schoolId: schoolId }, // ✅ تأكد من أن الحصص تنتمي للمدرسة
      populate: [
        { path: 'teacher', model: 'Teacher' },
        { path: 'schedule.classroom', model: 'Classroom' },
        { path: 'students', model: 'Student' }
      ]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'الطالب غير موجود أو لا ينتمي للمدرسة'
      });
    }

    res.json({
      success: true,
      data: student.classes || []
    });

  } catch (err) {
    console.error('❌ خطأ في جلب حصص الطالب:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

  // Get students in a specific class
  // In server.js - Update the /api/classes/:id endpoint

  // Get students for a specific class
  app.get('/api/classes/:id/students', async (req, res) => {
    try {
      const classId = req.params.id;
      
      if (!mongoose.Types.ObjectId.isValid(classId)) {
        return res.status(400).json({ 
          success: false,
          error: 'معرف الحصة غير صالح' 
        });
      }
      
      const classObj = await Class.findById(classId)
        .populate('students', 'name studentId parentPhone parentEmail academicYear');
      
      if (!classObj) {
        return res.status(404).json({ 
          success: false,
          error: 'الحصة غير موجودة' 
        });
      }
      
      res.json({
        success: true,
        data: classObj.students || []
      });
      
    } catch (err) {
      console.error('Error fetching class students:', err);
      res.status(500).json({ 
        success: false,
        error: err.message 
      });
    }
  });
  
//