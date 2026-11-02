// ✅ الكود الصحيح والجاهز لقيت هب
function saveDataAndNotify(formData) {
    // 1. حفظ البيانات محلياً في المتصفح (إذا رغبت)
    let records = JSON.parse(localStorage.getItem('myRecords') || '[]');
    records.push(formData);
    localStorage.setItem('myRecords', JSON.stringify(records));

    // 2. إرسال إشعار الواتساب الاحترافي مباشرة
    sendWhatsAppNotification({
        message: 'تم تسجيل بيانات جديدة في النظام بنجاح',
        details: `المستخدم: ${formData.name || 'غير معروف'}`
    });
}
