// دالة إرسال إشعار الواتساب الاحترافي للشركات
function sendWhatsAppNotification(eventData) {
    const phoneNumber = "966544699683"; 
    
    const message = `*إشعار رسمي بنظام التشغيل* 🌐\n\n` +
                    `عزيزي المسؤول،\n` +
                    `نحيطكم علماً بأنه تم رصد تفاعل جديد وتحديث في النظام:\n\n` +
                    `▪ *نوع الحدث:* ${eventData.message || 'تفاعل تشغيلي جديد'}\n` +
                    `▪ *التفاصيل:* ${eventData.details || 'لا توجد تفاصيل إضافية'}\n` +
                    `▪ *التوقيت:* ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}\n\n` +
                    `يرجى اتخاذ الإجراءات اللازمة عند الحاجة.\n` +
                    `مع خالص التحية،\n` +
                    `*فريق إدارة العمليات الرقمية*`;
    
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// دالة التعامل مع النموذج أو الزر الخاص بك (تأكد من ربطها بالزر أو الفورم لديك)
function handleFormSubmit(event) {
    // إذا كان الحدث مرتبط بـ form، امنع إعادة تحميل الصفحة
    if (event) event.preventDefault();

    // استخراج البيانات أو وضع بيانات افتراضية
    const actionDetails = "تم تنفيذ إجراء جديد بنجاح من خلال واجهة المستخدم";

    // استدعاء إشعار الواتساب مباشرة بدون أي طلبات سيرفر وهمية تسبب خطأ الـ JSON
    sendWhatsAppNotification({
        message: 'عملية ناجحة على المنصة',
        details: actionDetails
    });
}
