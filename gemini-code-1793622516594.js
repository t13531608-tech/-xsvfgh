function sendWhatsAppNotification(eventData) {
    // رقم الهاتف المعتمد مع رمز الدولة
    const phoneNumber = "966544699683"; 
    
    // صياغة الرسالة بأسلوب احترافي وعالمي
    const message = `*إشعار رسمي بنظام التشغيل* 🌐\n\n` +
                    `عزيزي المسؤول،\n` +
                    `نحيطكم علماً بأنه تم رصد تفاعل جديد وتحديث في النظام:\n\n` +
                    `▪ *نوع الحدث:* ${eventData.message || 'تفاعل تشغيلي جديد'}\n` +
                    `▪ *التفاصيل:* ${eventData.details || 'لا توجد تفاصيل إضافية'}\n` +
                    `▪ *التوقيت:* ${new Date().toLocaleString('ar-SA', { timeZone: 'Asia/Riyadh' })}\n\n` +
                    `يرجى اتخاذ الإجراءات اللازمة عند الحاجة.\n` +
                    `مع خالص التحية،\n` +
                    `*فريق إدارة العمليات الرقمية*`;
    
    // تجهيز الرابط المباشر
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // فتح الواتساب في نافذة جديدة
    window.open(whatsappUrl, '_blank');
}